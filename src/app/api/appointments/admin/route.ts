import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { generateBookingRef } from "@/lib/booking";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const adminBookingSchema = z.object({
  client: z.object({
    name: z.string().trim().min(2, "Client name is required."),
    phone: z.string().trim().optional().default(""),
    email: z.string().trim().email().optional().default(""),
  }),
  serviceId: z.string().uuid(),
  extras: z
    .array(
      z.object({
        serviceId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
      })
    )
    .optional()
    .default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().optional().default(""),
  overrideSlot: z.boolean().optional().default(false),
});

type Tx = Omit<
  import("@prisma/client").PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function intervalsOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return timeToMin(aStart) < timeToMin(bEnd) && timeToMin(aEnd) > timeToMin(bStart);
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = adminBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }

  const { client, serviceId, extras, date, startTime, notes, overrideSlot } = parsed.data;
  const dateStart = new Date(`${date}T00:00:00`);

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || !service.isActive) {
      return NextResponse.json({ error: "Service not available." }, { status: 422 });
    }

    // Validate extras
    const extrasCategory = await prisma.serviceCategory.findFirst({
      where: { name: "EXTRAS" },
    });
    const validatedExtras: {
      serviceId: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
    }[] = [];
    let extraTotal = 0;
    for (const extra of extras) {
      const extraService = await prisma.service.findUnique({
        where: { id: extra.serviceId },
      });
      if (!extraService || (extrasCategory && extraService.categoryId !== extrasCategory.id)) {
        return NextResponse.json(
          { error: `Extra "${extra.serviceId}" is invalid.` },
          { status: 422 }
        );
      }
      const total = extraService.price * extra.quantity;
      extraTotal += total;
      validatedExtras.push({
        serviceId: extraService.id,
        quantity: extra.quantity,
        pricePerUnit: extraService.price,
        totalPrice: total,
      });
    }

    const duration = service.duration > 0 ? service.duration : 120;
    const endTime = durationToEnd(startTime, duration);

    // Upsert client
    const emailLower = client.email.toLowerCase();
    let clientRecord = await prisma.client.findFirst({ where: { email: emailLower } });
    if (!clientRecord) {
      clientRecord = await prisma.client.create({
        data: { name: client.name, phone: client.phone, email: emailLower },
      });
    } else {
      clientRecord = await prisma.client.update({
        where: { id: clientRecord.id },
        data: { name: client.name, phone: client.phone || clientRecord.phone },
      });
    }

    let conflict: string | null = null;
    let appointment: Awaited<ReturnType<typeof prisma.appointment.findFirst>> | null = null;

    const txResult = await prisma.$transaction(async (tx) => {
      let appointmentResult: Awaited<ReturnType<typeof prisma.appointment.findFirst>> | null = null;
      let conflictResult: string | null = null;

      if (!overrideSlot) {
        const check = await validateSlot(tx, date, startTime, endTime, null);
        if (check !== null) {
          conflictResult = check;
          return { conflict: conflictResult, appointment: null };
        }
      }

      const bookingRef = await generateBookingRef();
      appointmentResult = await tx.appointment.create({
        data: {
          bookingRef,
          clientId: clientRecord!.id,
          serviceId: service.id,
          date: dateStart,
          startTime,
          endTime,
          duration,
          price: service.price + extraTotal,
          status: "CONFIRMED",
          notes: notes || null,
          cancelToken: uuidv4(),
          rescheduleToken: uuidv4(),
          extras: { create: validatedExtras },
        },
        include: { client: true, service: true, extras: { include: { service: true } } },
      });
      return { conflict: null, appointment: appointmentResult };
    });

    conflict = txResult.conflict;
    appointment = txResult.appointment;

    if (conflict || !appointment) {
      return NextResponse.json(
        { error: conflict ?? "That slot is no longer available." },
        { status: 409 }
      );
    }

    await logAudit(
      "APPOINTMENT_CREATED",
      "Appointment",
      appointment.id,
      `Booking ${appointment.bookingRef} created by admin${overrideSlot ? " (override)" : ""}`
    );

    return NextResponse.json({ appointment: { id: appointment.id, bookingRef: appointment.bookingRef } });
  } catch (error) {
    console.error("Admin booking error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

function durationToEnd(startTime: string, duration: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + duration;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

async function validateSlot(
  tx: Tx,
  date: string,
  startTime: string,
  endTime: string,
  excludeId: string | null
): Promise<string | null> {
  const day = new Date(`${date}T00:00:00`).getDay();
  const hours = await tx.businessHours.findFirst({ where: { dayOfWeek: day } });
  if (!hours || !hours.isActive) return "Business is closed on this day.";

  if (timeToMin(startTime) < timeToMin(hours.openTime) || timeToMin(endTime) > timeToMin(hours.closeTime)) {
    return "Outside of business hours.";
  }

  const breaks = await tx.businessBreak.findMany({ where: { dayOfWeek: day, isActive: true } });
  for (const b of breaks) {
    if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
      return "Overlaps a break.";
    }
  }

  const dateStart = new Date(`${date}T00:00:00.000`);
  const dateEnd = new Date(`${date}T23:59:59.999`);
  const apps = await tx.appointment.findMany({
    where: {
      date: { gte: dateStart, lte: dateEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  for (const a of apps) {
    if (intervalsOverlap(startTime, endTime, a.startTime, a.endTime)) {
      return "Conflicts with an existing appointment.";
    }
  }

  const blocks = await tx.blockedTime.findMany({ where: { date: { gte: dateStart, lte: dateEnd } } });
  for (const b of blocks) {
    if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
      return "Blocked time.";
    }
  }

  return null;
}