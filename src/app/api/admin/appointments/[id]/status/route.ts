import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "PENDING", "COMPLETED", "CANCELLED", "NO_SHOW"]),
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

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await logAudit(
    `APPOINTMENT_STATUS_${parsed.data.status}`,
    "Appointment",
    id,
    `Booking ${appointment.bookingRef} status changed to ${parsed.data.status}`
  );

  return NextResponse.json({
    appointment: { id: updated.id, status: updated.status },
  });
}