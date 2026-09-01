import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AdminRescheduleForm } from "@/components/admin/admin-reschedule-form";
import { formatDate } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function AdminReschedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { client: true, service: true },
  });

  if (!appointment) notFound();

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-6 font-serif-display text-2xl font-semibold">
        Reschedule Appointment
      </h1>
      <AdminRescheduleForm
        appointment={{
          id: appointment.id,
          bookingRef: appointment.bookingRef,
          clientName: appointment.client.name,
          serviceName: appointment.service.name,
          serviceDuration: appointment.duration,
          currentDate: formatDate(appointment.date),
          currentStartTime: appointment.startTime,
        }}
      />
    </div>
  );
}