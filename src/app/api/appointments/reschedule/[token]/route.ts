import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const rescheduleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { rescheduleToken: token },
    include: { client: true, service: true, extras: { include: { service: true } } },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "This rescheduling link is not valid." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    appointment: {
      bookingRef: appointment.bookingRef,
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
      date: appointment.date,
      serviceDuration: appointment.duration,
      status: appointment.status,
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = rescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reschedule request." },
      { status: 422 }
    );
  }

  const appointment = await prisma.appointment.findUnique({
    where: { rescheduleToken: token },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "This rescheduling link is not valid." },
      { status: 404 }
    );
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Cancelled appointments cannot be rescheduled." },
      { status: 422 }
    );
  }
  if (appointment.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Completed appointments cannot be rescheduled." },
      { status: 422 }
    );
  }

  const { date, startTime } = parsed.data;
  const endMin = timeToMin(startTime) + appointment.duration;
  const endTime = `${Math.floor(endMin / 60)
    .toString()
    .padStart(2, "0")}:${(endMin % 60).toString().padStart(2, "0")}`;

  const dateObj = new Date(`${date}T00:00:00`);
  const dayOfWeek = dateObj.getDay();

  const dateStart = new Date(`${date}T00:00:00.000`);
  const dateEnd = new Date(`${date}T23:59:59.999`);

  let conflict: string | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      const hours = await tx.businessHours.findFirst({ where: { dayOfWeek } });
      if (!hours || !hours.isActive) {
        conflict = "Business is closed on that day.";
        return;
      }
      if (
        timeToMin(startTime) < timeToMin(hours.openTime) ||
        timeToMin(endTime) > timeToMin(hours.closeTime)
      ) {
        conflict = "That time is outside of business hours.";
        return;
      }

      const breaks = await tx.businessBreak.findMany({
        where: { dayOfWeek, isActive: true },
      });
      for (const b of breaks) {
        if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
          conflict = "That time overlaps a break.";
          return;
        }
      }

      const apps = await tx.appointment.findMany({
        where: {
          date: { gte: dateStart, lte: dateEnd },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          id: { not: appointment.id },
        },
      });
      for (const a of apps) {
        if (intervalsOverlap(startTime, endTime, a.startTime, a.endTime)) {
          conflict = "That time conflicts with another appointment.";
          return;
        }
      }

      const blocks = await tx.blockedTime.findMany({
        where: { date: { gte: dateStart, lte: dateEnd } },
      });
      for (const b of blocks) {
        if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
          conflict = "That time is blocked.";
          return;
        }
      }

      await tx.appointment.update({
        where: { id: appointment.id },
        data: { date: dateObj, startTime, endTime },
      });
    });
  } catch (error) {
    console.error("Reschedule error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }

  if (conflict) {
    return NextResponse.json({ error: conflict }, { status: 409 });
  }

  await logAudit(
    "APPOINTMENT_RESCHEDULED",
    "Appointment",
    appointment.id,
    `Booking ${appointment.bookingRef} rescheduled by client`
  );

  return NextResponse.json({
    message: "Your appointment has been rescheduled.",
    date,
    startTime,
    endTime,
  });
}