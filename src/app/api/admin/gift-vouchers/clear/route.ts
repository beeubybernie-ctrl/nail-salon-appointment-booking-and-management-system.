import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(_request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await prisma.giftVoucher.count();
  if (count === 0) {
    return NextResponse.json({ error: "No vouchers to clear." }, { status: 400 });
  }

  await prisma.giftVoucher.deleteMany();
  await logAudit("VOUCHER_CLEAR_ALL", "GiftVoucher", undefined, `Cleared ${count} vouchers`);

  return NextResponse.json({ ok: true, deleted: count });
}