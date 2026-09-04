import { randomBytes } from "crypto";

export const VOUCHER_VALIDITY_MONTHS = 3;

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/1/O/0 to avoid confusion

function randomSuffix(len = 4): string {
  const bytes = randomBytes(len);
  return Array.from(bytes)
    .map((b) => CHARS[b % CHARS.length])
    .join("");
}

export function voucherNoFor(amount: number, purchasedAt: Date): string {
  const whole = Math.floor(amount).toString();
  const d = new Date(purchasedAt);
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear().toString();
  return `BU${whole}${dd}${mm}${yyyy}${randomSuffix()}`;
}

export function voucherValidUntil(purchasedAt: Date): Date {
  const d = new Date(purchasedAt);
  d.setMonth(d.getMonth() + VOUCHER_VALIDITY_MONTHS);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function voucherAmountLabel(amount: number): string {
  return `R${amount.toLocaleString("en-ZA")}`;
}

export function formatPurchaseDate(d: Date): string {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatValidUntil(d: Date): string {
  return new Date(d).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}