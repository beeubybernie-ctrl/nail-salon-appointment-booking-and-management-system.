"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatTime24to12 } from "@/lib/business";

interface Slot { start: string; end: string; label: string }

export function AdminRescheduleForm({
  appointment,
}: {
  appointment: {
    id: string;
    bookingRef: string;
    clientName: string;
    serviceName: string;
    serviceDuration: number;
    currentDate: string;
    currentStartTime: string;
  };
}) {
  const router = useRouter();
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push(`${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`);
    }
    setDates(list);
  }, []);

  async function loadSlots(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setLoadingSlots(true);
    setSlots([]);
    setError("");
    try {
      const res = await fetch(`/api/availability?date=${date}&duration=${appointment.serviceDuration}`, { cache: "no-store" });
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError("Could not load availability.");
    } finally {
      setLoadingSlots(false);
    }
  }

  async function confirm() {
    if (!selectedSlot || !selectedDate) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, startTime: selectedSlot.start }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/admin/appointments/${appointment.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const currentDateLabel = new Date(`${appointment.currentDate}T00:00:00`).toLocaleDateString("en-ZA", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="rounded-xl bg-primary/5 p-3 text-sm">
          <div className="flex justify-between"><span className="text-foreground/50">Booking</span><span className="font-medium">{appointment.bookingRef}</span></div>
          <div className="flex justify-between"><span className="text-foreground/50">Client</span><span className="font-medium">{appointment.clientName}</span></div>
          <div className="flex justify-between"><span className="text-foreground/50">Current</span><span className="font-medium">{currentDateLabel} at {formatTime24to12(appointment.currentStartTime)}</span></div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">New date</h3>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {dates.map((d) => {
              const date = new Date(`${d}T00:00:00`);
              const isSelected = selectedDate === d;
              return (
                <button key={d} type="button" onClick={() => loadSlots(d)} className={cn("flex flex-col items-center rounded-xl border p-2.5 text-center transition", isSelected ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-primary/15 hover:border-primary/40")}>
                  <span className="text-[10px] font-medium uppercase text-foreground/50">{date.toLocaleDateString("en-ZA", { weekday: "short" })}</span>
                  <span className="mt-0.5 text-lg font-semibold">{date.getDate()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDate && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">Available times</h3>
            {loadingSlots ? (
              <div className="flex items-center justify-center gap-2 py-5 text-foreground/50"><Loader2 className="h-5 w-5 animate-spin" /> Loading...</div>
            ) : slots.length === 0 ? (
              <p className="rounded-xl bg-primary/5 p-4 text-sm text-foreground/60">No appointments are available for this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button key={s.start} type="button" onClick={() => setSelectedSlot(s)} className={cn("rounded-xl border p-3 text-center text-sm font-medium transition", selectedSlot?.start === s.start ? "border-primary bg-primary text-white" : "border-primary/15 hover:border-primary/40")}>
                    {formatTime24to12(s.start)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button onClick={confirm} disabled={saving || !selectedSlot}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Confirm New Time
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}