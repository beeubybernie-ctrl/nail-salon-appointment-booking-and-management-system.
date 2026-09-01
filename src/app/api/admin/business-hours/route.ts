import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const hoursSchema = z.object({
  hours: z.array(
    z.object({
      id: z.string(),
      dayOfWeek: z.number().int().min(0).max(6),
      openTime: z.string().regex(/^\d{2}:\d{2}$/),
      closeTime: z.string().regex(/^\d{2}:\d{2}$/),
      isActive: z.boolean(),
    })
  ),
  breaks: z.array(
    z.object({
      id: z.string(),
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      isActive: z.boolean(),
    })
  ),
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

  const parsed = hoursSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  }

  const { hours, breaks } = parsed.data;

  for (const h of hours) {
    if (h.isActive && h.openTime >= h.closeTime) {
      return NextResponse.json({ error: "Opening time must be before closing time." }, { status: 422 });
    }
    await prisma.businessHours.update({
      where: { id: h.id },
      data: { openTime: h.openTime, closeTime: h.closeTime, isActive: h.isActive },
    });
  }

  // Handle breaks: upsert existing by id, create new ones
  for (const b of breaks) {
    if (b.startTime >= b.endTime) {
      return NextResponse.json({ error: "Break start must be before end." }, { status: 422 });
    }
    const existing = await prisma.businessBreak.findUnique({ where: { id: b.id } });
    if (existing) {
      await prisma.businessBreak.update({
        where: { id: b.id },
        data: { dayOfWeek: b.dayOfWeek, startTime: b.startTime, endTime: b.endTime, isActive: b.isActive },
      });
    } else {
      await prisma.businessBreak.create({
        data: { dayOfWeek: b.dayOfWeek, startTime: b.startTime, endTime: b.endTime, isActive: b.isActive },
      });
    }
  }

  await logAudit("BUSINESS_HOURS_CHANGED", "BusinessHours", undefined, "Business hours updated");

  return NextResponse.json({ success: true });
}