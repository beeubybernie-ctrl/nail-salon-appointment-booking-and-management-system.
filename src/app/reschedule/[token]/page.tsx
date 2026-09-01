"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTime24to12 } from "@/lib/business";

interface RescheduleAppointment {
  bookingRef: string;
  clientName: string;
  serviceName: string;
  date: string;
  serviceDuration: number;
  status: string;
}

export default function ReschedulePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<RescheduleAppointment | null>(null);
  const [error, setError] = useState("");

  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState<{ start: string; end: string; label: string }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string; label: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [successDate, setSuccessDate] = useState("");

  useEffect(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < 21; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      list.push(iso);
    }
    setDates(list);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/reschedule/${token}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "This link is not valid.");
      } else {
        setAppointment(data.appointment);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function loadSlots(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setSlots([]);
    try {
      const duration = appointment?.serviceDuration ?? 120;
      const res = await fetch(`/api/availability?date=${date}&duration=${duration}`, { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setSlots(data.slots ?? []);
      } else {
        setError(data.error ?? "Failed to load times.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirmReschedule() {
    if (!selectedDate || !selectedSlot) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/reschedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, startTime: selectedSlot.start }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccessDate(selectedDate);
        setDone(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = useMemo(() => {
    if (!selectedDate) return "";
    return new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDate]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="font-serif-display text-2xl font-semibold">Reschedule Appointment</h1>
        <p className="mt-2 text-sm text-foreground/60">Bee-U by Bernie · Be You. Be Beautiful.</p>
      </div>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 text-foreground/50">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading appointment...
        </div>
      )}

      {!loading && error && !appointment && (
        <Card className="mt-8">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-foreground/60">{error}</p>
            <Link href="/book" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Book an appointment</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {done && (
        <Card className="mt-8">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="mt-4 text-lg font-semibold">Appointment Rescheduled</h2>
            <p className="mt-2 text-sm text-foreground/60">
              Your new time is set for{" "}
              {new Date(`${successDate}T00:00:00`).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/">
                <Button className="w-full">Back to home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !done && appointment && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-5 w-5 text-accent" />
              Choose a new time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-xl bg-primary/5 p-3 text-sm">
              <div className="flex justify-between"><span className="text-foreground/50">Booking</span><span className="font-medium">{appointment.bookingRef}</span></div>
              <div className="flex justify-between"><span className="text-foreground/50">Service</span><span className="font-medium">{appointment.serviceName}</span></div>
            </div>

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">Select a new date</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {dates.map((d) => {
                const date = new Date(`${d}T00:00:00`);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => loadSlots(d)}
                    className={cn(
                      "flex flex-col items-center rounded-xl border p-2.5 text-center transition",
                      selectedDate === d ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-primary/15 hover:border-primary/40"
                    )}
                    aria-pressed={selectedDate === d}
                  >
                    <span className="text-[11px] font-medium uppercase text-foreground/50">{date.toLocaleDateString("en-ZA", { weekday: "short" })}</span>
                    <span className="mt-0.5 text-lg font-semibold">{date.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">Available times {dateLabel}</h3>
                {loadingSlots && (
                  <div className="flex items-center justify-center gap-2 py-5 text-foreground/50">
                    <Loader2 className="h-5 w-5 animate-spin" /> Checking availability...
                  </div>
                )}
                {!loadingSlots && slots.length === 0 && (
                  <p className="rounded-xl bg-primary/5 p-4 text-sm text-foreground/60">No appointments are available for this date. Please choose another date.</p>
                )}
                {!loadingSlots && slots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.start}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={cn(
                          "rounded-xl border p-3 text-center text-sm font-medium transition",
                          selectedSlot?.start === s.start ? "border-primary bg-primary text-white" : "border-primary/15 hover:border-primary/40"
                        )}
                      >
                        {formatTime24to12(s.start)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

            <div className="mt-6">
              <Button className="w-full" onClick={confirmReschedule} disabled={saving || !selectedSlot}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : "Confirm New Time"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}