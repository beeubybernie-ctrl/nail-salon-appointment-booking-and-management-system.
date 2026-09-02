import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

function csvCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const where: {
    status?: string;
    date?: { gte?: Date; lte?: Date };
  } = {};
  if (status) where.status = status;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(`${from}T00:00:00`);
    if (to) where.date.lte = new Date(`${to}T23:59:59`);
  }

  try {
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true,
        service: true,
        extras: { include: { service: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    const headers = [
      "Reference",
      "Client",
      "Phone",
      "Email",
      "Service",
      "Extras",
      "Date",
      "Start",
      "End",
      "Price",
      "Status",
      "Notes",
    ];

    const rows = appointments.map((a) => [
      a.bookingRef,
      a.client.name,
      a.client.phone,
      a.client.email,
      a.service.name,
      a.extras
        .map(
          (e) =>
            `${e.service.name}${e.quantity > 1 ? ` x${e.quantity}` : ""}`
        )
        .join("; "),
      new Date(a.date).toISOString().slice(0, 10),
      a.startTime,
      a.endTime,
      a.price,
      a.status,
      a.notes || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    await logAudit(
      "APPOINTMENTS_EXPORTED",
      "Appointment",
      undefined,
      `Exported ${appointments.length} appointments (status=${status || "any"})`
    );

    const filename = `bee-u-appointments-${
      from || to ? "filtered" : "all"
    }-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to export appointments." },
      { status: 500 }
    );
  }
}