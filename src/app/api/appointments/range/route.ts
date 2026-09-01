import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/business";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!start || !end) {
    return NextResponse.json({ error: "Missing start/end." }, { status: 400 });
  }

  const startDate = new Date(`${start}T00:00:00.000`);
  const endDate = new Date(`${end}T23:59:59.999`);

  const appointments = await prisma.appointment.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
    },
    include: { client: true, service: true },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({
    appointments: appointments.map((a) => ({
      id: a.id,
      clientName: a.client.name,
      serviceName: a.service.name,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
      price: a.price,
      date: formatDate(a.date),
    })),
  });
}