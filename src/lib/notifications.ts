import { BUSINESS } from "./business";

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || BUSINESS.whatsapp;
const ADMIN_EMAIL = process.env.BUSINESS_EMAIL || BUSINESS.email;

export function whatsappLink(
  message: string,
  number?: string
): string {
  const target = number || WHATSAPP_NUMBER;
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

/**
 * Normalises a South African phone number to international format (27xxxxxxxxx)
 * so it can be passed to the client's wa.me link. Handles "+27 82...",
 * "082...", "27...", and spaced formats. Falls back to the raw digits if unknown.
 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+27")) {
    return digits.replace(/^\+/, "");
  }
  if (digits.startsWith("27") && digits.length === 11) {
    return digits;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `27${digits.slice(1)}`;
  }
  if (digits.length === 11 && digits.startsWith("27")) {
    return digits;
  }
  return digits;
}

export function contactWhatsAppMessage(): string {
  return "Hello Bee-U by Bernie! I'd like to ask about a nail appointment.";
}

export interface BookingMessageData {
  bookingRef: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

export function bookingWhatsAppMessage(data: BookingMessageData): string {
  return [
    "Bee-U by Bernie",
    "",
    `Booking Reference: ${data.bookingRef}`,
    `Service: ${data.serviceName}`,
    `Date: ${data.date}`,
    `Time: ${data.startTime} - ${data.endTime}`,
    `Price: R${data.price}`,
    "",
    "Be You. Be Beautiful.",
  ].join("\n");
}

/**
 * Message shown to the client on the website after they submit a request.
 */
export function bookingRequestSubmittedSummary(data: BookingMessageData): string {
  return [
    "Bee-U by Bernie",
    "",
    `Booking Request Reference: ${data.bookingRef}`,
    `Service: ${data.serviceName}`,
    `Date: ${data.date}`,
    `Time: ${data.startTime} - ${data.endTime}`,
    `Estimated price: R${data.price}`,
    "",
    "We'll confirm shortly.",
    "Be You. Be Beautiful.",
  ].join("\n");
}

/**
 * WhatsApp message the admin sends the client to confirm their booking.
 */
export function bookingConfirmedWhatsAppMessage(data: BookingMessageData): string {
  return [
    "Bee-U by Bernie",
    "",
    "Friendly reminder, your appointment is confirmed:",
    "",
    `Booking Reference: ${data.bookingRef}`,
    `Service: ${data.serviceName}`,
    `Date: ${data.date}`,
    `Time: ${data.startTime} - ${data.endTime}`,
    `Price: R${data.price}`,
    "",
    "We look forward to seeing you!",
    "Be You. Be Beautiful.",
  ].join("\n");
}

/**
 * WhatsApp message pre-filled for the ADMIN so they can action a new request.
 * Opens the admin's own WhatsApp with the client's request already typed out.
 */
export function adminBookingRequestWhatsAppMessage(data: BookingMessageData): string {
  return [
    "NEW BOOKING REQUEST - Bee-U by Bernie",
    "",
    `Reference: ${data.bookingRef}`,
    `Service: ${data.serviceName}`,
    `Date: ${data.date}`,
    `Time: ${data.startTime} - ${data.endTime}`,
    `Price: R${data.price}`,
  ].join("\n");
}

export function cancellationWhatsAppMessage(data: BookingMessageData): string {
  return [
    "Bee-U by Bernie",
    "",
    `Cancelled Appointment Reference: ${data.bookingRef}`,
    `Service: ${data.serviceName}`,
    `Date: ${data.date}`,
    `Time: ${data.startTime} - ${data.endTime}`,
  ].join("\n");
}

/**
 * Builds a mailto: link that opens the admin's email client pre-filled
 * with the booking request. Always works — no provider needed.
 */
export function adminBookingRequestMailtoLink(data: BookingMessageData & { clientName?: string; clientEmail?: string; clientPhone?: string }): string {
  const subject = encodeURIComponent(`New Booking Request ${data.bookingRef} — Bee-U by Bernie`);
  const body = encodeURIComponent(
    [
      "NEW BOOKING REQUEST — Bee-U by Bernie",
      "",
      `Reference: ${data.bookingRef}`,
      `Client: ${data.clientName || "N/A"}`,
      `Phone: ${data.clientPhone || "N/A"}`,
      `Email: ${data.clientEmail || "N/A"}`,
      `Service: ${data.serviceName}`,
      `Date: ${data.date}`,
      `Time: ${data.startTime} - ${data.endTime}`,
      `Price: R${data.price}`,
      "",
      "Please confirm this booking as soon as possible.",
      "",
      "Be You. Be Beautiful.",
    ].join("\n")
  );
  return `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
}

/**
 * Sends a WhatsApp notification via a configurable provider.
 * If no provider is configured, returns { sent: false, reason: "NOT_CONFIGURED" }
 */
export async function sendWhatsApp(options: {
  to: string;
  body: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const provider = process.env.WHATSAPP_PROVIDER;
  const apiKey = process.env.WHATSAPP_API_KEY;

  if (!provider || !apiKey) {
    return { sent: false, reason: "NOT_CONFIGURED" };
  }

  try {
    const res = await fetch(`https://api.${provider}.com/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      return { sent: false, reason: "PROVIDER_ERROR" };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: "PROVIDER_ERROR" };
  }
}