import { prisma } from "./prisma";
import { formatISODate } from "./availability";

export async function generateBookingRef(): Promise<string> {
  const date = new Date();
  const dateStr = formatISODate(date);
  const prefix = `BU-${dateStr.replace(/-/g, "")}-`;

  // Try a few sequential numbers
  for (let i = 1; i < 10000; i++) {
    const candidate = `${prefix}${i.toString().padStart(3, "0")}`;
    const existing = await prisma.appointment.findUnique({
      where: { bookingRef: candidate },
    });
    if (!existing) return candidate;
  }

  // Fallback to random
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${random}`;
}