export const BUSINESS = {
  name: "Bee-U by Bernie",
  tagline: "Be You. Be Beautiful.",
  phone: "067 253 5540",
  whatsapp: "27672535540",
  email: "bee.u.by.bernie@gmail.com",
};

export function formatPrice(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

export function formatDateTime(dateStr: string, timeStr: string): string {
  return `${dateStr} at ${timeStr}`;
}

export function formatTime24to12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export function formatSlot(label: string, start: string, end: string): string {
  return `${formatTime24to12(start)} - ${formatTime24to12(end)}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatISODate(date: Date): string {
  return formatDate(date);
}
