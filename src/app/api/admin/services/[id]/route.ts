import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const serviceSchema = z.object({
  price: z.number().int().min(0),
  duration: z.number().int().min(0),
  isActive: z.boolean(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = serviceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  }

  const existing = await prisma.service.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  await prisma.service.update({
    where: { id },
    data: parsed.data,
  });

  await logAudit(
    "PRICE_CHANGED",
    "Service",
    id,
    `${existing.name} price updated to ${parsed.data.price}`
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
    include: { appointments: { select: { id: true } } },
  });
  if (!service) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }

  if (service.appointments.length > 0) {
    return NextResponse.json(
      {
        error:
          "This service has linked appointments and cannot be deleted. Set it to inactive instead.",
      },
      { status: 409 }
    );
  }

  await prisma.appointmentExtra.deleteMany({ where: { serviceId: id } });
  await prisma.service.delete({ where: { id } });

  await logAudit(
    "SERVICE_DELETED",
    "Service",
    id,
    `${service.name} deleted by admin`
  );

  return NextResponse.json({ success: true });
}