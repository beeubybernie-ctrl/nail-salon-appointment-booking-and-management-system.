import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";
import { voucherAmountLabel } from "@/lib/gift-voucher";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  status: z.enum(["REQUESTED", "PAID", "SENT", "REDEEMED", "CANCELLED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status." },
      { status: 422 }
    );
  }

  const existing = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  const updated = await prisma.giftVoucher.update({
    where: { id },
    data: {
      status: parsed.data.status,
      redeemedAt:
        parsed.data.status === "REDEEMED" ? new Date() : existing.redeemedAt,
    },
  });

  await logAudit(
    "VOUCHER_STATUS_CHANGED",
    "GiftVoucher",
    id,
    `Voucher ${updated.voucherNo} marked ${parsed.data.status}`
  );

  return NextResponse.json({
    voucher: {
      id: updated.id,
      voucherNo: updated.voucherNo,
      amount: Number(updated.amount),
      recipientName: updated.recipientName,
      status: updated.status,
      validUntil: updated.validUntil.toISOString(),
      amountLabel: voucherAmountLabel(Number(updated.amount)),
    },
  });
}