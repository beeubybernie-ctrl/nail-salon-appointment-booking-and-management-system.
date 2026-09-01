import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: token },
    include: { client: true, service: true, extras: { include: { service: true } } },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "This cancellation link is not valid." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    appointment: {
      bookingRef: appointment.bookingRef,
      clientName: appointment.client.name,
      serviceName: appointment.service.name,
      extras: appointment.extras.map((e) => ({
        name: e.service.name,
        quantity: e.quantity,
        total: e.totalPrice,
      })),
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      price: appointment.price,
      status: appointment.status,
    },
  });
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { cancelToken: token },
  });

  if (!appointment) {
    return NextResponse.json(
      { error: "This cancellation link is not valid." },
      { status: 404 }
    );
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json({
      message: "This appointment has already been cancelled.",
      status: "CANCELLED",
    });
  }

  if (appointment.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Completed appointments cannot be cancelled." },
      { status: 422 }
    );
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  await logAudit(
    "APPOINTMENT_CANCELLED",
    "Appointment",
    appointment.id,
    `Booking ${appointment.bookingRef} cancelled by client`
  );

  return NextResponse.json({
    message: "Your appointment has been cancelled.",
    bookingRef: updated.bookingRef,
  });
}