import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { buildVoucherListPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: "desc" },
  });

  await logAudit(
    "VOUCHERS_EXPORTED",
    "GiftVoucher",
    undefined,
    `Exported ${vouchers.length} gift vouchers (${format.toUpperCase()})`
  );

  const dateOf = (d: Date) => new Date(d).toISOString().slice(0, 10);
  const dateNice = (d: Date) =>
    new Date(d).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });

  if (format === "pdf") {
    const pdf = buildVoucherListPdf(
      vouchers.map((v) => ({
        voucherNo: v.voucherNo,
        recipientName: v.recipientName,
        amount: Number(v.amount),
        status: v.status,
        purchasedAt: v.purchasedAt,
        validUntil: v.validUntil,
      }))
    );
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="bee-u-gift-vouchers.pdf"`,
      },
    });
  }

  // CSV
  const headers = [
    "Voucher No",
    "Recipient",
    "Recipient Phone",
    "Value",
    "Status",
    "Purchased Date",
    "Valid Until",
    "Message",
    "Buyer Name",
    "Buyer Phone",
    "Buyer Email",
  ];
  const rows = vouchers.map((v) => [
    v.voucherNo,
    v.recipientName,
    v.recipientPhone,
    Number(v.amount),
    v.status,
    dateOf(v.purchasedAt),
    dateNice(v.validUntil),
    v.message,
    v.buyerName,
    v.buyerPhone,
    v.buyerEmail,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map(csvCell).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bee-u-gift-vouchers-${dateOf(new Date())}.csv"`,
    },
  });
}