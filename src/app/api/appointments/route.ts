import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { logAudit } from "@/lib/audit";
import { logNotification } from "@/lib/notifications-log";
import { adminBookingRequestWhatsAppMessage } from "@/lib/notifications";
import { BUSINESS } from "@/lib/business";
import type { PrismaClient, Prisma } from "@prisma/client";

type AppointmentCreate = Prisma.AppointmentGetPayload<{
  include: {
    client: true;
    service: true;
    extras: { include: { service: true } };
  };
}>;


export const dynamic = "force-dynamic";

const bookingSchema = z.object({
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
  name: z.string().trim().min(2, "Please enter your full name"),
  phone: z.string().trim().min(7, "Please enter a valid cellphone number"),
  email: z.string().trim().email("Please enter a valid email address"),
  notes: z.string().trim().max(500).optional().default(""),
  inspoImage: z.string().max(3_000_000).optional(),
  inspoImageName: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Please check the highlighted fields." },
      { status: 422 }
    );
  }

  const { serviceId, extras, date, startTime, name, phone, email, notes, inspoImage, inspoImageName } =
    parsed.data;

  const dateStart = new Date(`${date}T00:00:00`);
  const dateEnd = new Date(`${date}T23:59:59`);

  try {
    // Validate service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service || !service.isActive) {
      return NextResponse.json(
        { error: "That service is not available." },
        { status: 422 }
      );
    }

    // Validate extra services
    const totalPrice = service.price;
    let extraTotal = 0;
    const validatedExtras: {
      serviceId: string;
      quantity: number;
      pricePerUnit: number;
      totalPrice: number;
    }[] = [];

    const extrasCategory = await prisma.serviceCategory.findFirst({
      where: { name: "EXTRAS" },
    });

    for (const extra of extras) {
      const extraService = await prisma.service.findUnique({
        where: { id: extra.serviceId },
      });
      if (!extraService || !extraService.isActive) {
        return NextResponse.json(
          { error: `Extra "${extra.serviceId}" is not available.` },
          { status: 422 }
        );
      }
      if (extrasCategory && extraService.categoryId !== extrasCategory.id) {
        return NextResponse.json(
          { error: `"${extraService.name}" is not an extra service.` },
          { status: 422 }
        );
      }
      const pricePerUnit = extraService.price;
      const total = pricePerUnit * extra.quantity;
      extraTotal += total;
      validatedExtras.push({
        serviceId: extraService.id,
        quantity: extra.quantity,
        pricePerUnit,
        totalPrice: total,
      });
    }

    // Compute endTime from duration
    const duration = service.duration > 0 ? service.duration : 120;
    const [startH, startM] = startTime.split(":").map(Number);
    const startMin = startH * 60 + startM;
    const endMin = startMin + duration;
    const endTime = `${Math.floor(endMin / 60)
      .toString()
      .padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

    // Build client record
    const client = await upsertClient(name, phone, email);

    // Transaction with re-check to prevent double booking
    const created = await prisma.$transaction(async (tx) => {
      const check = await isSlotAvailableForTx(tx, date, startTime, endTime);

      if (!check.valid) {
        return { conflict: true as const, appointment: null as AppointmentCreate | null };
      }

      const bookingRef = await generateBookingRefForTx(tx);

      const appt = await tx.appointment.create({
        data: {
          bookingRef,
          clientId: client.id,
          serviceId: service.id,
          date: dateStart,
          startTime,
          endTime,
          duration,
          price: totalPrice + extraTotal,
          status: "PENDING",
          notes: notes || null,
          inspoImage: inspoImage || null,
          inspoImageName: inspoImageName || null,
          cancelToken: uuidv4(),
          rescheduleToken: uuidv4(),
          extras: {
            create: validatedExtras,
          },
        },
        include: {
          client: true,
          service: true,
          extras: { include: { service: true } },
        },
      });
      return { conflict: false as const, appointment: appt };
    });

    const { conflict, appointment } = created;

    if (conflict || !appointment) {
      return NextResponse.json(
        {
          error:
            "Sorry, that appointment was just booked by another client. Please select another time.",
        },
        { status: 409 }
      );
    }

    await logAudit(
      "APPOINTMENT_REQUESTED",
      "Appointment",
      appointment.id,
      `Request ${appointment.bookingRef} submitted by client (pending approval)`
    );

    // Record an in-app notification for the admin about the new request.
    const dateLabel = dateStart.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const requestMessage = adminBookingRequestWhatsAppMessage({
      bookingRef: appointment.bookingRef,
      serviceName: appointment.service.name,
      date: dateLabel,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      price: appointment.price,
    });
    await logNotification({
      type: "BOOKING_REQUEST",
      recipient: "admin",
      subject: `New booking request ${appointment.bookingRef}`,
      body: requestMessage,
    });

    const dateISO = new Date(appointment.date);

    return NextResponse.json({
      appointment: {
        bookingRef: appointment.bookingRef,
        clientName: appointment.client.name,
        serviceName: appointment.service.name,
        extraDetails: appointment.extras.map((e) => ({
          name: e.service.name,
          quantity: e.quantity,
          pricePerUnit: e.pricePerUnit,
          total: e.totalPrice,
        })),
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        price: appointment.price,
        status: appointment.status,
      },
      adminContactMessage: requestMessage,
      cancelLink:
        `${process.env.NEXT_PUBLIC_APP_URL || ""}/cancel/${appointment.cancelToken}`,
      rescheduleLink:
        `${process.env.NEXT_PUBLIC_APP_URL || ""}/reschedule/${appointment.rescheduleToken}`,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

async function upsertClient(name: string, phone: string, email: string) {
  const emailLower = email.toLowerCase();
  let client = await prisma.client.findFirst({
    where: { email: emailLower },
  });
  if (!client) {
    client = await prisma.client.create({
      data: { name, phone, email: emailLower },
    });
  } else {
    // Optionally update name/phone if changed
    client = await prisma.client.update({
      where: { id: client.id },
      data: { name, phone },
    });
  }
  return client;
}

type Tx = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

async function isSlotAvailableForTx(
  tx: Tx,
  date: string,
  startTime: string,
  endTime: string
) {
  const dateStart = new Date(`${date}T00:00:00.000`);
  const dateEnd = new Date(`${date}T23:59:59.999`);

  const day = dateStart.getDay();

  const hours = await tx.businessHours.findFirst({ where: { dayOfWeek: day } });
  if (!hours || !hours.isActive) {
    return { valid: false as const };
  }

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  if (
    toMin(startTime) < toMin(hours.openTime) ||
    toMin(endTime) > toMin(hours.closeTime)
  ) {
    return { valid: false as const };
  }

  const breaks = await tx.businessBreak.findMany({
    where: { dayOfWeek: day, isActive: true },
  });
  for (const b of breaks) {
    if (
      toMin(startTime) < toMin(b.endTime) &&
      toMin(endTime) > toMin(b.startTime)
    ) {
      return { valid: false as const };
    }
  }

  const apps = await tx.appointment.findMany({
    where: {
      date: { gte: dateStart, lte: dateEnd },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
  });
  for (const a of apps) {
    if (
      toMin(startTime) < toMin(a.endTime) &&
      toMin(endTime) > toMin(a.startTime)
    ) {
      return { valid: false as const };
    }
  }

  const blocks = await tx.blockedTime.findMany({
    where: { date: { gte: dateStart, lte: dateEnd } },
  });
  for (const b of blocks) {
    if (
      toMin(startTime) < toMin(b.endTime) &&
      toMin(endTime) > toMin(b.startTime)
    ) {
      return { valid: false as const };
    }
  }

  return { valid: true as const };
}

async function generateBookingRefForTx(tx: Tx): Promise<string> {
  const d = new Date();
  const prefix = `BU-${d.getFullYear()}${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${d.getDate().toString().padStart(2, "0")}-`;
  for (let i = 1; i < 10000; i++) {
    const candidate = `${prefix}${i.toString().padStart(3, "0")}`;
    const existing = await tx.appointment.findUnique({
      where: { bookingRef: candidate },
    });
    if (!existing) return candidate;
  }
  return `${prefix}${Math.floor(Math.random() * 9000 + 1000)}`;
}