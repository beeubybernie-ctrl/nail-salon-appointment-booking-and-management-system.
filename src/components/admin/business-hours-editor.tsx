"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HoursRow {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
}

interface BreakRow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function BusinessHoursEditor({
  hours,
  breaks,
}: {
  hours: HoursRow[];
  breaks: BreakRow[];
}) {
  const router = useRouter();
  const [hoursState, setHoursState] = useState(hours);
  const [breaksState, setBreaksState] = useState(breaks);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateHour(id: string, field: keyof HoursRow, value: string | boolean) {
    setHoursState((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
    setSaved(false);
  }

  function updateBreak(id: string, field: keyof BreakRow, value: string | boolean) {
    setBreaksState((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
    setSaved(false);
  }

  function addBreak(dayOfWeek: number) {
    setBreaksState((prev) => [...prev, { id: `new-${Date.now()}`, dayOfWeek, startTime: "12:00", endTime: "12:30", isActive: true }]);
    setSaved(false);
  }

  function removeBreak(id: string) {
    setBreaksState((prev) => prev.filter((b) => b.id !== id));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours: hoursState, breaks: breaksState }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold">Business Hours</h1>
          <p className="text-sm text-foreground/60">
            Set opening, closing times and breaks for each day.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {saved && (
        <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          ✓ Business hours saved. Availability now uses these settings.
        </p>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Opening Hours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day, i) => {
            const h = hoursState.find((x) => x.dayOfWeek === i);
            if (!h) return null;
            return (
              <div key={i} className="flex flex-wrap items-end gap-3 border-b border-primary/10 pb-3 last:border-0">
                <div className="w-28 pt-2">
                  <Label className="text-xs">{day}</Label>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={h.isActive}
                    onChange={(e) => updateHour(h.id, "isActive", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label className="text-xs font-normal">Open</Label>
                </div>
                <div>
                  <Label className="text-xs">Open</Label>
                  <Input
                    type="time"
                    className="mt-1 h-10 w-28"
                    value={h.openTime}
                    disabled={!h.isActive}
                    onChange={(e) => updateHour(h.id, "openTime", e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Close</Label>
                  <Input
                    type="time"
                    className="mt-1 h-10 w-28"
                    value={h.closeTime}
                    disabled={!h.isActive}
                    onChange={(e) => updateHour(h.id, "closeTime", e.target.value)}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Breaks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {DAYS.map((day, i) => {
            const dayBreaks = breaksState.filter((b) => b.dayOfWeek === i);
            return (
              <div key={i}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">{day}</span>
                  <Button size="sm" variant="ghost" onClick={() => addBreak(i)}>+ Add break</Button>
                </div>
                {dayBreaks.length === 0 ? (
                  <p className="text-sm text-foreground/50">No breaks.</p>
                ) : (
                  <div className="space-y-2">
                    {dayBreaks.map((b) => (
                      <div key={b.id} className="flex flex-wrap items-end gap-3">
                        <div>
                          <Label className="text-xs">Start</Label>
                          <Input type="time" className="mt-1 h-10 w-28" value={b.startTime} onChange={(e) => updateBreak(b.id, "startTime", e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">End</Label>
                          <Input type="time" className="mt-1 h-10 w-28" value={b.endTime} onChange={(e) => updateBreak(b.id, "endTime", e.target.value)} />
                        </div>
                        <div className="flex items-center gap-1 pb-2">
                          <input type="checkbox" checked={b.isActive} onChange={(e) => updateBreak(b.id, "isActive", e.target.checked)} className="h-4 w-4" />
                          <Label className="text-xs font-normal">Active</Label>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removeBreak(b.id)} className="text-red-600">Remove</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}