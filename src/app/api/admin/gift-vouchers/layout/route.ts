import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LAYOUT_KEY = "voucherLayout";

const DEFAULT_LAYOUT = {
  amount: { x: 75, y: 5 },
  to: { x: 30, y: 40 },
  from: { x: 30, y: 55 },
  voucherNo: { x: 5, y: 85 },
  validUntil: { x: 70, y: 85 },
};

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setting = await prisma.setting.findUnique({ where: { key: LAYOUT_KEY } });
  const layout = setting ? JSON.parse(setting.value) : DEFAULT_LAYOUT;

  return NextResponse.json({ layout });
}

export async function PUT(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid layout data." }, { status: 400 });
  }

  await prisma.setting.upsert({
    where: { key: LAYOUT_KEY },
    update: { value: JSON.stringify(body) },
    create: { key: LAYOUT_KEY, value: JSON.stringify(body) },
  });

  return NextResponse.json({ ok: true });
}