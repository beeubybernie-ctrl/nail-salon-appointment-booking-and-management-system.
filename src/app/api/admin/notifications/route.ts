import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { count } = await prisma.notificationLog.deleteMany({});
    await logAudit(
      "NOTIFICATIONS_CLEARED",
      "NotificationLog",
      "all",
      `Cleared ${count} notification entries`
    );
    return NextResponse.json({ cleared: count });
  } catch {
    return NextResponse.json(
      { error: "Failed to clear notifications." },
      { status: 500 }
    );
  }
}