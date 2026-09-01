"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsEditor({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: settings.businessName ?? "Bee-U by Bernie",
    tagline: settings.tagline ?? "Be You. Be Beautiful.",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
    defaultDuration: settings.defaultDuration ?? "120",
    minAdvanceBooking: settings.minAdvanceBooking ?? "0",
    maxAdvanceBooking: settings.maxAdvanceBooking ?? "30",
    allowSameDay: settings.allowSameDay ?? "true",
    allowClientCancellation: settings.allowClientCancellation ?? "true",
    cancellationDeadline: settings.cancellationDeadline ?? "24",
    reminderTime: settings.reminderTime ?? "24",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-foreground/60">Business information & booking preferences.</p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {saved && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">✓ Settings saved.</p>}
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <Card>
        <CardHeader><CardTitle className="text-lg">Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Business Name</Label>
              <Input className="mt-1" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </div>
            <div>
              <Label>Tagline</Label>
              <Input className="mt-1" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-lg">Appointment Duration</CardTitle></CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="dur">Default appointment duration (minutes)</Label>
            <Input
              id="dur"
              type="number"
              min={30}
              className="mt-1"
              value={form.defaultDuration}
              onChange={(e) => set("defaultDuration", e.target.value)}
            />
            <p className="mt-1 text-xs text-foreground/50">
              Default is 120 minutes. When services have their own duration set, that is used first.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle className="text-lg">Booking Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="min">Minimum advance booking (days)</Label>
              <Input id="min" type="number" min={0} className="mt-1" value={form.minAdvanceBooking} onChange={(e) => set("minAdvanceBooking", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="max">Maximum advance booking period (days)</Label>
              <Input id="max" type="number" min={1} className="mt-1" value={form.maxAdvanceBooking} onChange={(e) => set("maxAdvanceBooking", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <input id="same" type="checkbox" checked={form.allowSameDay === "true"} onChange={(e) => set("allowSameDay", e.target.checked ? "true" : "false")} className="h-4 w-4" />
              <Label htmlFor="same">Allow same-day bookings</Label>
            </div>
            <div className="flex items-center gap-2">
              <input id="cancel" type="checkbox" checked={form.allowClientCancellation === "true"} onChange={(e) => set("allowClientCancellation", e.target.checked ? "true" : "false")} className="h-4 w-4" />
              <Label htmlFor="cancel">Allow client cancellation</Label>
            </div>
            <div>
              <Label htmlFor="canceldeadline">Cancellation deadline (hours before)</Label>
              <Input id="canceldeadline" type="number" min={0} className="mt-1" value={form.cancellationDeadline} onChange={(e) => set("cancellationDeadline", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="reminder">Reminder time (hours before)</Label>
              <Input id="reminder" type="number" min={0} className="mt-1" value={form.reminderTime} onChange={(e) => set("reminderTime", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}