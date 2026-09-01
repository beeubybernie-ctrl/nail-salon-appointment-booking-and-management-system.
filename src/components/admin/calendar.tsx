"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, formatTime24to12 } from "@/lib/business";
import { cn } from "@/lib/utils";

type View = "day" | "week" | "month";

interface CalendarAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  date: string;
}

const STATUS_BG: Record<string, string> = {
  CONFIRMED: "border-l-green-500",
  PENDING: "border-l-amber-500",
  COMPLETED: "border-l-blue-500",
  CANCELLED: "border-l-red-500",
  NO_SHOW: "border-l-zinc-500",
};

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

export function AdminCalendar() {
  const [view, setView] = useState<View>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const start = startOfView(cursor, view);
    const end = endOfView(start, view);
    setLoading(true);
    fetch(
      `/api/appointments/range?start=${toISODate(start)}&end=${toISODate(end)}`
    )
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments ?? []))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, view]);

  function startOfView(d: Date, v: View): Date {
    const n = new Date(d);
    if (v === "week") {
      const day = n.getDay();
      n.setDate(n.getDate() - day);
    } else if (v === "month") {
      n.setDate(1);
    }
    n.setHours(0, 0, 0, 0);
    return n;
  }

  function endOfView(start: Date, v: View): Date {
    const end = new Date(start);
    if (v === "day") end.setDate(start.getDate() + 1);
    else if (v === "week") end.setDate(start.getDate() + 7);
    else if (v === "month") {
      end.setMonth(start.getMonth() + 1);
      end.setDate(0);
    }
    return end;
  }

  function shift(direction: 1 | -1) {
    const n = new Date(cursor);
    if (view === "day") n.setDate(n.getDate() + direction);
    else if (view === "week") n.setDate(n.getDate() + 7 * direction);
    else if (view === "month") n.setMonth(n.getMonth() + direction);
    setCursor(n);
  }

  const dateKey = toISODate(cursor);
  const weekDays = useMemo(() => {
    const start = startOfView(cursor, "week");
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthDays = useMemo(() => {
    const start = startOfView(cursor, "month");
    const days: Date[] = [];
    const total = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= total; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), i));
    }
    return days;
  }, [cursor]);

  function apptsForDate(dateStr: string) {
    return appointments
      .filter((a) => a.date.startsWith(dateStr))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  const isToday = (d: Date) => toISODate(d) === toISODate(new Date());

  const title =
    view === "day"
      ? cursor.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : view === "week"
        ? `${weekDays[0].toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}`
        : cursor.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold">Calendar</h1>
          <p className="text-sm text-foreground/60">{title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-primary/20">
            {(["day", "week", "month"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-2 text-sm font-medium capitalize",
                  view === v ? "bg-primary text-white" : "bg-white text-foreground/70 hover:bg-primary/5"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => shift(-1)} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCursor(new Date())}>Today</Button>
            <Button size="icon" variant="ghost" onClick={() => shift(1)} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/admin/appointments/new">
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-foreground/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Updating calendar...
        </div>
      ) : view === "day" ? (
        <DayView date={cursor} appointments={apptsForDate(dateKey)} />
      ) : view === "week" ? (
        <WeekView days={weekDays} isToday={isToday} getAppts={apptsForDate} />
      ) : (
        <MonthView days={monthDays} isToday={isToday} getAppts={apptsForDate} />
      )}
    </div>
  );
}

function AppointmentCard({
  appt,
  inMonth,
}: {
  appt: CalendarAppointment;
  inMonth?: boolean;
}) {
  return (
    <Link
      href={`/admin/appointments/${appt.id}`}
      className={cn(
        "block rounded-lg border border-primary/10 border-l-4 bg-white p-2 hover:shadow-sm",
        STATUS_BG[appt.status] ?? "border-l-gray-400"
      )}
    >
      <p className="text-xs font-semibold">{appt.clientName}</p>
      <p className="text-xs text-foreground/60">
        {formatTime24to12(appt.startTime)} · {appt.serviceName}
      </p>
      {!inMonth && (
        <div className="mt-1"><StatusBadge status={appt.status} /></div>
      )}
    </Link>
  );
}

function DayView({ date, appointments }: { date: Date; appointments: CalendarAppointment[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        {appointments.length === 0 ? (
          <div className="py-16 text-center text-foreground/50">No appointments on this day.</div>
        ) : (
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id}>
                <AppointmentCard appt={a} />
                <p className="mt-1 pl-2 text-xs text-foreground/50">{formatPrice(a.price)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WeekView({
  days,
  isToday,
  getAppts,
}: {
  days: Date[];
  isToday: (d: Date) => boolean;
  getAppts: (d: string) => CalendarAppointment[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
      {days.map((d) => {
        const key = toISODate(d);
        const appts = getAppts(key);
        return (
          <div key={key} className={cn("rounded-xl border bg-white p-2 min-h-[180px]", isToday(d) ? "border-primary" : "border-primary/15")}>
            <div className={cn("mb-2 rounded-lg px-2 py-1 text-center text-xs font-semibold", isToday(d) ? "bg-primary text-white" : "bg-primary/10 text-primary-dark")}>
              {d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" })}
            </div>
            <div className="space-y-1.5">
              {appts.length === 0 && <p className="px-1 text-xs text-foreground/40">—</p>}
              {appts.map((a) => <AppointmentCard key={a.id} appt={a} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({
  days,
  isToday,
  getAppts,
}: {
  days: Date[];
  isToday: (d: Date) => boolean;
  getAppts: (d: string) => CalendarAppointment[];
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {days.map((d) => {
        const key = toISODate(d);
        const appts = getAppts(key);
        return (
          <div key={key} className={cn("rounded-xl border bg-white p-2", isToday(d) ? "border-primary" : "border-primary/15")}>
            <div className={cn("mb-2 rounded-lg px-2 py-1 text-center text-xs font-semibold", isToday(d) ? "bg-primary text-white" : "bg-primary/10 text-primary-dark")}>
              {d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric" })}
            </div>
            <div className="space-y-1.5">
              {appts.length === 0 ? (
                <p className="px-1 text-xs text-foreground/40">No appointments</p>
              ) : (
                appts.slice(0, 3).map((a) => <AppointmentCard key={a.id} appt={a} inMonth />)
              )}
              {appts.length > 3 && (
                <p className="px-1 text-xs font-medium text-foreground/50">
                  +{appts.length - 3} more
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}