import { bookingWhatsAppMessage } from "./notifications";

/**
 * Builds a WhatsApp link to the business's number with a booking message.
 */
export function whatsappClientLink(data: {
  bookingRef: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}): string {
  const message = bookingWhatsAppMessage(data);
  const number = process.env.WHATSAPP_NUMBER;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
