import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, formatTime24to12 } from "@/lib/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { service: true },
        orderBy: [{ date: "desc" }, { startTime: "asc" }],
      },
    },
  });

  if (!client) notFound();

  const now = new Date();
  const totalSpend = client.appointments
    .filter((a) => a.status !== "CANCELLED")
    .reduce((s, a) => s + a.price, 0);
  const upcoming = client.appointments.find(
    (a) =>
      a.date >= now &&
      a.status !== "CANCELLED" &&
      a.status !== "COMPLETED" &&
      a.status !== "NO_SHOW"
  );
  const lastAppointment = client.appointments.find(
    (a) => a.date < now || a.status === "COMPLETED"
  );

  function formatDate(d: Date) {
    return new Date(d).toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-4 sm:p-6">
      <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      <div className="mb-6">
        <h1 className="font-serif-display text-2xl font-semibold">{client.name}</h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-foreground/70">
          {client.phone && (
            <span className="inline-flex items-center gap-1"><Phone className="h-4 w-4" /> {client.phone}</span>
          )}
          {client.email && (
            <span className="inline-flex items-center gap-1"><Mail className="h-4 w-4" /> {client.email}</span>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><p className="text-xl font-bold">{client.appointments.length}</p><p className="text-xs text-foreground/60">Total Appointments</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-bold">{formatPrice(totalSpend)}</p><p className="text-xs text-foreground/60">Total Spend</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm font-semibold">{upcoming ? formatDate(upcoming.date) : "—"}</p><p className="text-xs text-foreground/60">Upcoming Appointment</p></CardContent></Card>
      </div>

      {client.notes && (
        <Card className="mt-4">
          <CardContent className="p-4 text-sm"><span className="font-medium">Notes: </span>{client.notes}</CardContent>
        </Card>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Appointment History</h2>
        {client.appointments.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-foreground/60">No appointments yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {client.appointments.map((a) => (
              <Link key={a.id} href={`/admin/appointments/${a.id}`}>
                <Card className="hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{a.service.name}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="text-xs text-foreground/50">{a.bookingRef}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(a.date)}</p>
                      <p className="text-xs text-primary-dark">{formatTime24to12(a.startTime)} · {formatPrice(a.price)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}