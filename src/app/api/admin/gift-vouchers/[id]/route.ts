import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Voucher not found." }, { status: 404 });
  }

  await prisma.giftVoucher.delete({ where: { id } });

  await logAudit(
    "VOUCHER_DELETED",
    "GiftVoucher",
    id,
    `Deleted voucher ${existing.voucherNo}`
  );

  return NextResponse.json({ ok: true });
}