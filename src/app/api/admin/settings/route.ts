import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const settingsSchema = z.object({
  businessName: z.string().trim().min(1),
  tagline: z.string().trim(),
  phone: z.string().trim(),
  email: z.string().trim().email(),
  defaultDuration: z.coerce.number().int().min(30).max(600),
  minAdvanceBooking: z.coerce.number().int().min(0),
  maxAdvanceBooking: z.coerce.number().int().min(1),
  allowSameDay: z.string(),
  allowClientCancellation: z.string(),
  cancellationDeadline: z.coerce.number().int().min(0),
  reminderTime: z.coerce.number().int().min(0),
});

export async function PUT(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  }

  const data = parsed.data;

  await prisma.$transaction(
    Object.entries(data).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    )
  );

  await logAudit("SETTINGS_CHANGED", "Setting", undefined, "Booking and business settings updated");

  return NextResponse.json({ success: true });
}