import { BUSINESS } from "./business";

const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || BUSINESS.whatsapp;

export function whatsappLink(
  message: string,
  number?: string
): string {
  const target = number || WHATSAPP_NUMBER;
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
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
 * Sends an email notification via a configurable provider.
 * If no provider is configured, returns { sent: false, reason: "NOT_CONFIGURED" }
 * Never pretends to have sent a message.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const provider = process.env.EMAIL_PROVIDER;
  const apiKey = process.env.EMAIL_API_KEY;

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