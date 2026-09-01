import { prisma } from "@/lib/prisma";
import { NewAppointmentForm } from "@/components/admin/new-appointment-form";
import type { ServiceOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: { services: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });

  const data = categories
    .filter((c) => c.services.length > 0)
    .map((c) => ({
      categoryName: c.name,
      services: c.services.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        duration: s.duration,
        isPerNail: s.isPerNail,
      })),
    }));

  return <NewAppointmentForm catalog={data} />;
}