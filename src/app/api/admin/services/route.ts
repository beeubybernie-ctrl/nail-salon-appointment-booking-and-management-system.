import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createServiceSchema = z.object({
  name: z.string().trim().min(1, "Please enter a service name."),
  price: z.coerce.number().int().min(0),
  duration: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, "Please choose a category."),
  isPerNail: z.boolean(),
  order: z.coerce.number().int().min(0).optional(),
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

  const parsed = createServiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const category = await prisma.serviceCategory.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const existing = await prisma.service.findFirst({
    where: { name: data.name },
  });
  if (existing) {
    return NextResponse.json(
      { error: "A service with this name already exists." },
      { status: 409 }
    );
  }

  const maxOrder = await prisma.service.aggregate({
    where: { categoryId: data.categoryId, isActive: true },
    _max: { order: true },
  });

  const service = await prisma.service.create({
    data: {
      name: data.name,
      price: data.price,
      duration: data.duration,
      categoryId: data.categoryId,
      isPerNail: data.isPerNail,
      isActive: true,
      order: data.order ?? (maxOrder._max.order ?? 0) + 1,
    },
  });

  await logAudit(
    "SERVICE_CREATED",
    "Service",
    service.id,
    `${service.name} created in ${category.name}`
  );

  return NextResponse.json({ success: true, service });
}