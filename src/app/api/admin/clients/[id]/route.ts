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

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ error: "Client not found." }, { status: 404 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { clientId: id },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const a of appointments) {
      await tx.appointmentExtra.deleteMany({ where: { appointmentId: a.id } });
    }
    await tx.appointment.deleteMany({ where: { clientId: id } });
    await tx.client.delete({ where: { id } });
  });

  await logAudit(
    "CLIENT_DELETED",
    "Client",
    id,
    `${client.name} and ${appointments.length} linked appointment(s) deleted`
  );

  return NextResponse.json({ success: true });
}