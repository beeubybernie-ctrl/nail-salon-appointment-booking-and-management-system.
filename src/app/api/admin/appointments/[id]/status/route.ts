import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { logNotification } from "@/lib/notifications-log";
import { bookingConfirmedWhatsAppMessage, whatsappLink, toWhatsAppNumber } from "@/lib/notifications";
import {
  bookingConfirmedClientEmailHtml,
  sendBookingEmail,
} from "@/lib/email-service";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

function dateLabel(date: Date): string {
  return new Date(date).toLocaleDateString("en-ZA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status." },
      { status: 422 }
    );
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  let clientWhatsAppLink: string | null = null;
  let clientMessage: string | null = null;

  // When an admin confirms a PENDING request, prepare the WhatsApp confirmation
  // link they can open to message the client, and record a notification.
  const isConfirm = parsed.data.status === "CONFIRMED" && appointment.status === "PENDING";
  if (isConfirm) {
    const message = bookingConfirmedWhatsAppMessage({
      bookingRef: appointment.bookingRef,
      serviceName: appointment.service.name,
      date: dateLabel(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      price: appointment.price,
    });
    clientMessage = message;

    const clientNumber = toWhatsAppNumber(appointment.client.phone || "");
    clientWhatsAppLink = clientNumber ? whatsappLink(message, clientNumber) : null;

    await logNotification({
      type: "BOOKING_CONFIRMED",
      recipient: appointment.client.phone || "client",
      subject: `Booking ${appointment.bookingRef} confirmed`,
      body: message,
    });

    // Send the client a confirmation email.
    const emailData = {
      bookingRef: appointment.bookingRef,
      serviceName: appointment.service.name,
      date: dateLabel(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      price: appointment.price,
    };
    await sendBookingEmail({
      to: appointment.client.email,
      subject: `Your Booking ${appointment.bookingRef} is Confirmed — Bee-U by Bernie`,
      body: message,
      html: bookingConfirmedClientEmailHtml(emailData),
    });

    // Send the client a WhatsApp confirmation.
    if (clientNumber) {
      await sendWhatsAppMessage(clientNumber, message);
    }

    await logAudit(
      "APPOINTMENT_CONFIRMED",
      "Appointment",
      id,
      `Request ${appointment.bookingRef} confirmed by admin`
    );
  }

  await logAudit(
    `APPOINTMENT_STATUS_${parsed.data.status}`,
    "Appointment",
    id,
    `Booking ${appointment.bookingRef} status changed to ${parsed.data.status}`
  );

  return NextResponse.json({
    appointment: { id: updated.id, status: updated.status },
    clientWhatsAppLink,
    clientMessage,
  });
}