import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return timeToMin(aStart) < timeToMin(bEnd) && timeToMin(aEnd) > timeToMin(bStart);
}

export async function POST(
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

  const { date, startTime } = body;
  if (!date || !startTime) {
    return NextResponse.json({ error: "Date and time required." }, { status: 422 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: "Appointment not found." }, { status: 404 });

  const endMin = timeToMin(startTime) + appointment.duration;
  const endTime = `${Math.floor(endMin / 60).toString().padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

  const dateStart = new Date(`${date}T00:00:00`);
  const dateEnd = new Date(`${date}T23:59:59.999`);
  const day = dateStart.getDay();

  const hours = await prisma.businessHours.findFirst({ where: { dayOfWeek: day } });
  if (!hours || !hours.isActive) {
    return NextResponse.json({ error: "Business is closed on that day." }, { status: 409 });
  }
  if (timeToMin(startTime) < timeToMin(hours.openTime) || timeToMin(endTime) > timeToMin(hours.closeTime)) {
    return NextResponse.json({ error: "Outside of business hours." }, { status: 409 });
  }

  const breaks = await prisma.businessBreak.findMany({ where: { dayOfWeek: day, isActive: true } });
  for (const b of breaks) {
    if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
      return NextResponse.json({ error: "Overlaps a break." }, { status: 409 });
    }
  }

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

  await prisma.appointment.update({
    where: { id },
    data: { date: dateStart, startTime, endTime },
  });

  await logAudit("APPOINTMENT_RESCHEDULED", "Appointment", id, `Booking rescheduled by admin`);

  return NextResponse.json({ success: true });
}