import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { buildVoucherTicketPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const voucher = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!voucher) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  const pdf = buildVoucherTicketPdf({
    voucherNo: voucher.voucherNo,
    amount: Number(voucher.amount),
    recipientName: voucher.recipientName,
    validUntil: voucher.validUntil,
    purchasedAt: voucher.purchasedAt,
    message: voucher.message,
  });

  await logAudit(
    "VOUCHER_DOWNLOADED",
    "GiftVoucher",
    id,
    `Downloaded voucher ${voucher.voucherNo}`
  );

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bee-u-voucher-${voucher.voucherNo}.pdf"`,
    },
  });
}