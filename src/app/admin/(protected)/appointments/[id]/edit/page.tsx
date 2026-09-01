import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EditAppointmentForm } from "@/components/admin/edit-appointment-form";
import { formatDate } from "@/lib/business";
import type { CategoryOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true, extras: true },
  });

  if (!appointment) notFound();

  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: { services: { where: { isActive: true }, orderBy: { order: "asc" } } },
  });

  const catalog: CategoryOption[] = categories
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

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-6 font-serif-display text-2xl font-semibold">
        Edit Appointment
      </h1>
      <EditAppointmentForm
        appointment={{
          id: appointment.id,
          clientName: appointment.client.name,
          phone: appointment.client.phone,
          email: appointment.client.email,
          serviceId: appointment.serviceId,
          extraServiceIds: appointment.extras.map((e) => e.serviceId),
          date: formatDate(appointment.date),
          startTime: appointment.startTime,
          notes: appointment.notes ?? "",
        }}
        catalog={catalog}
      />
    </div>
  );
}