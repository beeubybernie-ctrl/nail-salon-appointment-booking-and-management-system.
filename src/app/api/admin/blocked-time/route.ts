import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const blockSchema = z.object({
  title: z.string().trim().min(2, "Title is required."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().trim().optional().default(""),
});

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = blockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }

  const { title, date, startTime, endTime, notes } = parsed.data;
  if (startTime >= endTime) {
    return NextResponse.json({ error: "End time must be after start time." }, { status: 422 });
  }

  const block = await prisma.blockedTime.create({
    data: {
      title,
      date: new Date(`${date}T00:00:00`),
      startTime,
      endTime,
      notes: notes || null,
    },
  });

  await logAudit("BLOCKED_TIME_CREATED", "BlockedTime", block.id, title);

  return NextResponse.json({ block });
}