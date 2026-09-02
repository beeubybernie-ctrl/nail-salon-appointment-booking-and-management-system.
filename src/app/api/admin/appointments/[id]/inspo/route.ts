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
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
  }

  await prisma.appointment.update({
    where: { id },
    data: { inspoImage: null, inspoImageName: null },
  });

  await logAudit(
    "APPOINTMENT_INSPO_REMOVED",
    "Appointment",
    id,
    `Inspiration photo removed by admin (ref ${appointment.bookingRef})`
  );

  return NextResponse.json({ success: true });
}