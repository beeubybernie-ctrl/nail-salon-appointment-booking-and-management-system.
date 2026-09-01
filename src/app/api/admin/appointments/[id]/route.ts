import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMin(aStart) < timeToMin(bEnd) && timeToMin(aEnd) > timeToMin(bStart);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const {
    clientName, phone, email, serviceId, extraServiceIds = [],
    date, startTime, notes, overrideSlot,
  } = body;

  if (!clientName?.trim() || !serviceId || !date || !startTime) {
    return NextResponse.json({ error: "Please fill all required fields." }, { status: 422 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "Service not found." }, { status: 422 });

  const duration = service.duration > 0 ? service.duration : 120;
  const endMin = timeToMin(startTime) + duration;
  const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

  const dateStart = new Date(`${date}T00:00:00`);
  const day = dateStart.getDay();

  // Validate slot (unless override)
  if (!overrideSlot) {
    const hours = await prisma.businessHours.findFirst({ where: { dayOfWeek: day } });
    if (!hours || !hours.isActive) return NextResponse.json({ error: "Business is closed on this day." }, { status: 409 });

    if (timeToMin(startTime) < timeToMin(hours.openTime) || timeToMin(endTime) > timeToMin(hours.closeTime)) {
      return NextResponse.json({ error: "Outside of business hours." }, { status: 409 });
    }

    const breaks = await prisma.businessBreak.findMany({ where: { dayOfWeek: day, isActive: true } });
    for (const b of breaks) {
      if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
        return NextResponse.json({ error: "Overlaps a break." }, { status: 409 });
      }
    }

    const dateEnd = new Date(`${date}T23:59:59.999`);
    const conflicts = await prisma.appointment.findMany({
      where: {
        date: { gte: dateStart, lte: dateEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        id: { not: id },
      },
    });
    for (const c of conflicts) {
      if (intervalsOverlap(startTime, endTime, c.startTime, c.endTime)) {
        return NextResponse.json({ error: "Conflicts with another appointment." }, { status: 409 });
      }
    }

    const blocks = await prisma.blockedTime.findMany({ where: { date: { gte: dateStart, lte: dateEnd } } });
    for (const b of blocks) {
      if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
        return NextResponse.json({ error: "Conflicts with a blocked time." }, { status: 409 });
      }
    }
  }

  // Calculate price
  const extrasCategory = await prisma.serviceCategory.findFirst({ where: { name: "EXTRAS" } });
  let extraTotal = 0;
  const validatedExtras: { serviceId: string; quantity: number; pricePerUnit: number; totalPrice: number }[] = [];

  for (const extraId of extraServiceIds) {
    const extraService = await prisma.service.findUnique({ where: { id: extraId } });
    if (extraService) {
      const qty = extraService.isPerNail ? 10 : 1;
      const total = extraService.price * qty;
      extraTotal += total;
      validatedExtras.push({ serviceId: extraId, quantity: qty, pricePerUnit: extraService.price, totalPrice: total });
    }
  }

  const newPrice = service.price + extraTotal;

  // Upsert client
  const emailLower = email?.toLowerCase() ?? "";
  let clientRecord = emailLower
    ? await prisma.client.findFirst({ where: { email: emailLower } })
    : null;

  if (clientRecord) {
    await prisma.client.update({
      where: { id: clientRecord.id },
      data: { name: clientName.trim(), phone: phone || clientRecord.phone },
    });
  } else if (emailLower) {
    clientRecord = await prisma.client.create({
      data: { name: clientName.trim(), phone: phone || "", email: emailLower },
    });
  }

  // Update appointment
  await prisma.appointmentExtra.deleteMany({ where: { appointmentId: id } });

  await prisma.appointment.update({
    where: { id },
    data: {
      clientId: clientRecord?.id ?? appointment.clientId,
      serviceId,
      date: dateStart,
      startTime,
      endTime,
      duration,
      price: newPrice,
      notes: notes || null,
      extras: {
        create: validatedExtras,
      },
    },
  });

  await logAudit("APPOINTMENT_EDITED", "Appointment", id, `Booking edited by admin`);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointmentExtra.deleteMany({ where: { appointmentId: id } });
    await tx.appointment.delete({ where: { id } });
  });

  await logAudit(
    "APPOINTMENT_DELETED",
    "Appointment",
    id,
    `Booking deleted by admin (ref ${appointment.bookingRef})`
  );

  return NextResponse.json({ success: true });
}