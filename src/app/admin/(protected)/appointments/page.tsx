import { prisma } from "@/lib/prisma";
import { formatPrice, formatTime24to12 } from "@/lib/business";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarClock, BellRing, MessageCircle } from "lucide-react";
import { DeleteAppointmentButton } from "@/components/admin/appointment-delete-button";
import { ConfirmAppointmentButton } from "@/components/admin/confirm-appointment-button";
import { clientConfirmWhatsAppLink } from "@/lib/whatsapp-confirm";

export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const showPending = filter === "pending";

  const appointments = await prisma.appointment.findMany({
    include: { client: true, service: true },
    where: showPending ? { status: "PENDING" } : undefined,
    orderBy: [{ date: "desc" }, { startTime: "asc" }],
  });

  const pendingCount = showPending
    ? appointments.length
    : await prisma.appointment.count({ where: { status: "PENDING" } });

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold">Appointments</h1>
          <p className="text-sm text-foreground/60">
            {appointments.length} total
          </p>
        </div>
        <Link
          href="/admin/appointments/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
        >
          + Add Appointment
        </Link>
      </div>

      {pendingCount > 0 && (
        <Link
          href={showPending ? "/admin/appointments" : "/admin/appointments?filter=pending"}
          className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 hover:bg-amber-100"
        >
          <BellRing className="h-5 w-5" />
          <span>
            {showPending ? (
              <>
                Showing <strong>{pendingCount}</strong> booking{" "}
                {pendingCount === 1 ? "request" : "requests"}.
                Click to view all appointments.
              </>
            ) : (
              <>
                <strong>{pendingCount}</strong> booking{" "}
                {pendingCount === 1 ? "request" : "requests"} awaiting your
                confirmation. Click to review.
              </>
            )}
          </span>
        </Link>
      )}

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <CalendarClock className="h-10 w-10 text-primary/40" />
            <p className="font-medium">No appointments yet</p>
            <p className="text-sm text-foreground/60">
              Bookings from clients and manual appointments will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-primary/10 text-left text-xs font-semibold uppercase tracking-wider text-foreground/50">
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3">Client</th>
                <th className="p-3">Service</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/10">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-primary/5">
                  <td className="p-3">
                    <Link href={`/admin/appointments/${a.id}`} className="font-medium hover:text-accent">
                      {formatDate(a.date)}
                    </Link>
                  </td>
                  <td className="p-3">
                    {formatTime24to12(a.startTime)} – {formatTime24to12(a.endTime)}
                  </td>
                  <td className="p-3">{a.client.name}</td>
                  <td className="p-3">{a.service.name}</td>
                  <td className="p-3 font-medium">{formatPrice(a.price)}</td>
                  <td className="p-3"><StatusBadge status={a.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.status === "PENDING" && (
                        <ConfirmAppointmentButton
                          appointmentId={a.id}
                          size="sm"
                          variant="success"
                        />
                      )}
                      {a.status === "CONFIRMED" &&
                        (() => {
                          const link = clientConfirmWhatsAppLink({
                            bookingRef: a.bookingRef,
                            serviceName: a.service.name,
                            date: new Date(a.date).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                            startTime: a.startTime,
                            endTime: a.endTime,
                            price: a.price,
                            phone: a.client.phone || "",
                          });
                          return link ? (
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send WhatsApp confirmation to client"
                              className="inline-flex h-8 items-center gap-1 px-2 text-xs font-medium text-[#25a85c] hover:underline"
                            >
                              <MessageCircle className="h-3.5 w-3.5" /> WA Confirm
                            </a>
                          ) : null;
                        })()}
                      <DeleteAppointmentButton appointmentId={a.id} className="h-8 px-2 text-xs" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}