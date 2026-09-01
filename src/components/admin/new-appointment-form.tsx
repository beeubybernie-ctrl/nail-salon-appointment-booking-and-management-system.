"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice, formatTime24to12 } from "@/lib/business";
import type { CategoryOption, ServiceOption } from "@/lib/types";

interface ExtraSelection {
  serviceId: string;
  name: string;
  price: number;
  isPerNail: boolean;
  quantity: number;
}

export function NewAppointmentForm({ catalog }: { catalog: CategoryOption[] }) {
  const router = useRouter();
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [extras, setExtras] = useState<ExtraSelection[]>([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [notes, setNotes] = useState("");
  const [overrideSlot, setOverrideSlot] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const extrasCategory = catalog.find((c) => c.categoryName === "EXTRAS");
  const selectedService = useMemo(
    () =>
      catalog
        .filter((c) => c.categoryName !== "EXTRAS")
        .flatMap((c) => c.services)
        .find((s) => s.id === serviceId),
    [catalog, serviceId]
  );

  const total = useMemo(() => {
    let t = selectedService?.price ?? 0;
    for (const e of extras) t += e.price * e.quantity;
    return t;
  }, [selectedService, extras]);

  function toggleExtra(s: ServiceOption) {
    setExtras((prev) => {
      if (prev.some((e) => e.serviceId === s.id)) {
        return prev.filter((e) => e.serviceId !== s.id);
      }
      return [
        ...prev,
        { serviceId: s.id, name: s.name, price: s.price, isPerNail: s.isPerNail, quantity: s.isPerNail ? 10 : 1 },
      ];
    });
  }

  function checkAvailability() {
    if (!date || !startTime || !selectedService) return;
    setCheckingAvailability(true);
    setAvailability(null);
    const duration = selectedService.duration > 0 ? selectedService.duration : 120;
    fetch(`/api/availability/${date}/${startTime}/${duration}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setAvailability({ valid: true });
        } else {
          setAvailability({ valid: false, reason: data.reason });
        }
      })
      .catch(() => setAvailability({ valid: false, reason: "Could not check availability." }))
      .finally(() => setCheckingAvailability(false));
  }

  async function handleSubmit() {
    setError("");
    if (!clientName.trim()) { setError("Client name is required."); return; }
    if (!serviceId) { setError("Please select a service."); return; }
    if (!date || !startTime) { setError("Please select a date and time."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/appointments/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { name: clientName.trim(), phone: phone.trim(), email: email.trim() },
          serviceId,
          extras: extras.map((e) => ({ serviceId: e.serviceId, quantity: e.quantity })),
          date,
          startTime,
          notes: notes.trim(),
          overrideSlot,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      router.push(`/admin/appointments/${data.appointment.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="mb-6 font-serif-display text-2xl font-semibold">
        Add Appointment
      </h1>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Client</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cname">Full Name *</Label>
              <Input id="cname" className="mt-1" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cphone">Phone</Label>
              <Input id="cphone" className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cemail">Email</Label>
              <Input id="cemail" type="email" className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Service</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="service">Service *</Label>
              <Select id="service" className="mt-1" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Select a service</option>
                {catalog
                  .filter((c) => c.categoryName !== "EXTRAS")
                  .map((cat) => (
                    <optgroup key={cat.categoryName} label={cat.categoryName}>
                      {cat.services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {formatPrice(s.price)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </Select>
            </div>

            {extrasCategory && (
              <div>
                <Label>Extras (optional)</Label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {extrasCategory.services.map((s) => {
                    const selected = extras.some((e) => e.serviceId === s.id);
                    return (
                      <div key={s.id}>
                        <button
                          type="button"
                          onClick={() => toggleExtra(s)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg border p-3 text-sm",
                            selected ? "border-accent bg-accent/10" : "border-primary/15 hover:border-accent/40"
                          )}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-primary-dark">
                            {s.isPerNail ? `${formatPrice(s.price)}/nail` : formatPrice(s.price)}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-primary/10 pt-3">
              <span className="text-sm text-foreground/50">Total</span>
              <span className="text-lg font-semibold text-primary-dark">{formatPrice(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Date & Time</CardTitle>
          <p className="text-sm text-foreground/50">
            Availability is validated to prevent overlapping bookings.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="time">Start Time *</Label>
              <Input id="time" type="time" className="mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={checkAvailability} disabled={checkingAvailability || !date || !startTime}>
              {checkingAvailability ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
              Check Availability
            </Button>
            {availability && (
              <span className={cn("text-sm", availability.valid ? "text-green-600" : "text-red-600")}>
                {availability.valid ? "✓ Time is available" : `✗ ${availability.reason}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="override"
              type="checkbox"
              checked={overrideSlot}
              onChange={(e) => setOverrideSlot(e.target.checked)}
              className="h-4 w-4 rounded border-primary/30 text-primary"
            />
            <Label htmlFor="override" className="text-sm">
              Override availability (use only if you intentionally want a conflicting slot)
            </Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {loading ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}