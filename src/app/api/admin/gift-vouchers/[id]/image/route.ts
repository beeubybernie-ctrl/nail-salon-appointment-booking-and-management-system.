import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getVoucherLayout } from "@/lib/gift-voucher";
import { buildVoucherPng } from "@/lib/voucher-image";

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

  const layout = await getVoucherLayout();

  const png = await buildVoucherPng({
    voucherNo: voucher.voucherNo,
    amount: Number(voucher.amount),
    recipientName: voucher.recipientName,
    buyerName: voucher.buyerName,
    validUntil: voucher.validUntil,
    layout,
  });

  await logAudit(
    "VOUCHER_DOWNLOADED",
    "GiftVoucher",
    id,
    `Downloaded voucher image ${voucher.voucherNo}`
  );

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="bee-u-voucher-${voucher.voucherNo}.png"`,
    },
  });
}
