import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatPrice, formatTime24to12 } from "@/lib/business";
import { AppointmentActions } from "@/components/admin/appointment-actions";
import { whatsappLink } from "@/lib/notifications";
import { whatsappClientLink } from "@/lib/whatsapp-client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: true,
      service: true,
      extras: { include: { service: true } },
    },
  });

  if (!appointment) notFound();

  const cancelLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/cancel/${appointment.cancelToken}`;
  const rescheduleLink = `${process.env.NEXT_PUBLIC_APP_URL || ""}/reschedule/${appointment.rescheduleToken}`;
  const waLink = whatsappClientLink({
    bookingRef: appointment.bookingRef,
    serviceName: appointment.service.name,
    date: new Date(appointment.date).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    startTime: appointment.startTime,
    endTime: appointment.endTime,
    price: appointment.price,
  });

  return (
    <div className="p-4 sm:p-6">
      <Link
        href="/admin/appointments"
        className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to appointments
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif-display text-2xl font-semibold">
              {appointment.client.name}
            </h1>
            <StatusBadge status={appointment.status} />
          </div>
          <p className="mt-1 text-sm text-foreground/60">
            {appointment.bookingRef}
          </p>
        </div>
        <AppointmentActions
          appointmentId={appointment.id}
          status={appointment.status}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Service" value={appointment.service.name} />
            {appointment.extras.length > 0 && (
              <DetailRow
                label="Extras"
                value={appointment.extras
                  .map((e) =>
                    `${e.service.name}${e.quantity > 1 ? ` ×${e.quantity}` : ""} (+${formatPrice(e.totalPrice)})`
                  )
                  .join(", ")}
              />
            )}
            <DetailRow
              label="Date"
              value={new Date(appointment.date).toLocaleDateString("en-ZA", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            />
            <DetailRow
              label="Time"
              value={`${formatTime24to12(appointment.startTime)} – ${formatTime24to12(appointment.endTime)}`}
            />
            <DetailRow label="Duration" value={`${appointment.duration} minutes`} />
            <DetailRow label="Price" value={formatPrice(appointment.price)} strong />
            {appointment.notes && (
              <DetailRow label="Notes" value={appointment.notes} />
            )}
            <DetailRow
              label="Created"
              value={appointment.createdAt.toLocaleString("en-ZA")}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Name" value={appointment.client.name} />
            <DetailRow label="Phone" value={appointment.client.phone} />
            <DetailRow label="Email" value={appointment.client.email} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <a href={waLink} target="_blank" rel="noopener noreferrer">
          <Card className="hover:border-[#25a85c]/40">
            <CardContent className="flex items-center justify-between p-4 text-sm font-medium text-[#25a85c]">
              <span>Contact on WhatsApp</span>
              <span aria-hidden>💬</span>
            </CardContent>
          </Card>
        </a>
        <a href={rescheduleLink} target="_blank" rel="noopener noreferrer">
          <Card className="hover:border-primary/40">
            <CardContent className="flex items-center justify-between p-4 text-sm font-medium text-primary-dark">
              Reschedule Link
            </CardContent>
          </Card>
        </a>
        <a href={cancelLink} target="_blank" rel="noopener noreferrer">
          <Card className="hover:border-red-300">
            <CardContent className="flex items-center justify-between p-4 text-sm font-medium text-red-600">
              Cancellation Link
            </CardContent>
          </Card>
        </a>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-primary/5 pb-2 last:border-0">
      <span className="text-foreground/50">{label}</span>
      <span className={`text-right ${strong ? "font-semibold text-primary-dark" : "font-medium"}`}>
        {value}
      </span>
    </div>
  );
}