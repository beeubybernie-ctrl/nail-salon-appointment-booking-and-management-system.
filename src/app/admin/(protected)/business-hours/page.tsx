import { prisma } from "@/lib/prisma";
import { BusinessHoursEditor } from "@/components/admin/business-hours-editor";

export const dynamic = "force-dynamic";

export default async function BusinessHoursPage() {
  const hours = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: "asc" },
  });
  const breaks = await prisma.businessBreak.findMany({
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return <BusinessHoursEditor hours={hours} breaks={breaks} />;
}