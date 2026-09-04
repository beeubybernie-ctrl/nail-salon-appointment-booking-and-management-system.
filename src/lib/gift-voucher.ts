import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export const VOUCHER_VALIDITY_MONTHS = 3;

export interface FieldPos {
  x: number;
  y: number;
  size: number;
  font: string;
}

export interface VoucherLayout {
  amount: FieldPos;
  to: FieldPos;
  from: FieldPos;
  voucherNo: FieldPos;
  validUntil: FieldPos;
}

const DEFAULT_LAYOUT: VoucherLayout = {
  amount: { x: 75, y: 5, size: 18, font: "sans" },
  to: { x: 30, y: 40, size: 18, font: "sans" },
  from: { x: 30, y: 55, size: 18, font: "sans" },
  voucherNo: { x: 5, y: 85, size: 14, font: "mono" },
  validUntil: { x: 70, y: 85, size: 16, font: "sans" },
};

export async function getVoucherLayout(): Promise<VoucherLayout> {
  const setting = await prisma.setting.findUnique({ where: { key: "voucherLayout" } });
  if (!setting) return DEFAULT_LAYOUT;
  try {
    const parsed = JSON.parse(setting.value);
    const merge = {} as VoucherLayout;
    (Object.keys(DEFAULT_LAYOUT) as (keyof VoucherLayout)[]).forEach((k) => {
      const d = DEFAULT_LAYOUT[k];
      const p = parsed[k] ?? {};
      merge[k] = {
        x: p.x ?? d.x,
        y: p.y ?? d.y,
        size: p.size ?? d.size,
        font: p.font ?? d.font,
      };
    });
    return merge;
  } catch {
    return DEFAULT_LAYOUT;
  }
}

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
  const nd = new Date(d);
  const dd = nd.getDate().toString().padStart(2, "0");
  const mm = (nd.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = nd.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export interface ValidUntilParts {
  day: string;
  month: string;
  year: string;
}

export function validUntilParts(d: Date): ValidUntilParts {
  const nd = new Date(d);
  return {
    day: nd.getDate().toString().padStart(2, "0"),
    month: (nd.getMonth() + 1).toString().padStart(2, "0"),
    year: nd.getFullYear().toString(),
  };
}