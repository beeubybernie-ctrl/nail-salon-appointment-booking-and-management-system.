import { prisma } from "@/lib/prisma";
import { formatPrice, formatTime24to12, formatDate } from "@/lib/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";
import {
  CalendarCheck2,
  Users,
  Banknote,
  CheckCircle2,
  XCircle,
  UserX,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayStart.getDate() + 1);

  const now = new Date();

  const next7Start = todayStart;
  const next7End = new Date(todayStart);
  next7End.setDate(todayStart.getDate() + 7);

  const next30End = new Date(todayStart);
  next30End.setDate(todayStart.getDate() + 30);

  const [todaysAppointments, upcoming7, upcoming30, stats] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        date: { gte: todayStart, lt: todayEnd },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      include: { client: true, service: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: todayStart, lt: next7End },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      include: { client: true, service: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.appointment.findMany({
      where: {
        date: { gte: todayStart, lt: next30End },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
      },
      include: { client: true, service: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { price: true },
    }),
  ]);

  const todayRevenue = todaysAppointments.reduce((sum, a) => sum + a.price, 0);

  const statusCounts: Record<string, number> = {};
  let totalRevenue = 0;
  for (const s of stats) {
    statusCounts[s.status] = s._count._all;
    if (s.status !== "CANCELLED" && s.status !== "NO_SHOW") {
      totalRevenue += s._sum.price ?? 0;
    }
  }

  const nextAppointment = todaysAppointments.find(
    (a) => new Date(`${formatDate(a.date)}T${a.startTime}`) >= now
  ) ?? todaysAppointments[0];

  function formatDateLong(d: Date) {
    return new Date(d).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-sm text-foreground/60">{formatDateLong(new Date())}</p>
        </div>
        <Link
          href="/admin/appointments/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark"
        >
          <Sparkles className="h-4 w-4" /> + Add Appointment
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<Banknote className="h-5 w-5 text-green-600" />}
          label="Today's Revenue"
          value={formatPrice(todayRevenue)}
        />
        <StatCard
          icon={<CalendarCheck2 className="h-5 w-5 text-primary-dark" />}
          label="Today's Appointments"
          value={todaysAppointments.length.toString()}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-blue-600" />}
          label="Completed"
          value={(statusCounts["COMPLETED"] ?? 0).toString()}
        />
        <StatCard
          icon={<Banknote className="h-5 w-5 text-primary-dark" />}
          label="Total Revenue"
          value={formatPrice(totalRevenue)}
        />
      </div>

      {/* Today's appointments */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Today&apos;s Appointments</h2>
          <Link href="/admin/appointments" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {todaysAppointments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
              <CalendarCheck2 className="h-10 w-10 text-primary/40" />
              <p className="font-medium">No appointments today</p>
              <p className="text-sm text-foreground/60">
                Relax — you have a clear schedule for today.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {todaysAppointments.map((a) => (
              <Link key={a.id} href={`/admin/appointments/${a.id}`}>
                <Card className="hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{a.client.name}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      <p className="mt-1 text-sm text-foreground/60">{a.service.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary-dark">
                        {formatTime24to12(a.startTime)}
                      </p>
                      <p className="text-xs font-medium">{formatPrice(a.price)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {nextAppointment && (
          <Card className="mt-4 bg-primary/5">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-foreground/50">
                  Next appointment
                </p>
                <p className="mt-1 text-base font-semibold">
                  {nextAppointment.client.name}
                </p>
                <p className="text-sm text-foreground/60">
                  {nextAppointment.service.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-primary-dark">
                  {formatTime24to12(nextAppointment.startTime)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Upcoming */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Upcoming (Next 7 Days)</h2>
        {upcoming7.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-foreground/60">
              No upcoming appointments.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming7.map((a) => (
              <Link key={a.id} href={`/admin/appointments/${a.id}`}>
                <Card className="hover:border-primary/40">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-semibold">{a.client.name}</p>
                      <p className="text-sm text-foreground/60">{a.service.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDateLong(a.date)}</p>
                      <p className="text-xs text-primary-dark">{formatTime24to12(a.startTime)}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Status overview */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Statistics</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusStat icon={<CalendarCheck2 className="h-4 w-4" />} label="Total Bookings" value={(statusCounts["CONFIRMED"] ?? 0) + (statusCounts["PENDING"] ?? 0) + (statusCounts["COMPLETED"] ?? 0)} />
          <StatusStat icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={statusCounts["COMPLETED"] ?? 0} />
          <StatusStat icon={<XCircle className="h-4 w-4" />} label="Cancelled" value={statusCounts["CANCELLED"] ?? 0} />
          <StatusStat icon={<UserX className="h-4 w-4" />} label="No-Shows" value={statusCounts["NO_SHOW"] ?? 0} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-foreground/60">{icon}</div>
        <p className="mt-2 text-xl font-bold">{value}</p>
        <p className="text-xs text-foreground/60">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatusStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="text-foreground/60">{icon}</span>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-foreground/60">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}