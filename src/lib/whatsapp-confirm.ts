import {
  bookingConfirmedWhatsAppMessage,
  whatsappLink,
  toWhatsAppNumber,
} from "./notifications";

/**
 * Builds a wa.me link for an admin to send a booking-confirmed message to a
 * client. Returns null when the client has no usable phone number.
 * Can be used from server components so the link persists after status changes.
 */
export function clientConfirmWhatsAppLink(opts: {
  bookingRef: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  phone: string;
}): string | null {
  const number = toWhatsAppNumber(opts.phone || "");
  if (!number) return null;
  const message = bookingConfirmedWhatsAppMessage({
    bookingRef: opts.bookingRef,
    serviceName: opts.serviceName,
    date: opts.date,
    startTime: opts.startTime,
    endTime: opts.endTime,
    price: opts.price,
  });
  return whatsappLink(message, number);
}