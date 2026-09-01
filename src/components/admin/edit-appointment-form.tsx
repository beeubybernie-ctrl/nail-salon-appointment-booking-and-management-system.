"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/business";
import type { CategoryOption } from "@/lib/types";

export function EditAppointmentForm({
  appointment,
  catalog,
}: {
  appointment: {
    id: string;
    clientName: string;
    phone: string;
    email: string;
    serviceId: string;
    extraServiceIds: string[];
    date: string;
    startTime: string;
    notes: string;
  };
  catalog: CategoryOption[];
}) {
  const router = useRouter();
  const [clientName, setClientName] = useState(appointment.clientName);
  const [phone, setPhone] = useState(appointment.phone);
  const [email, setEmail] = useState(appointment.email);
  const [serviceId, setServiceId] = useState(appointment.serviceId);
  const [extraIds, setExtraIds] = useState<string[]>(appointment.extraServiceIds);
  const [date, setDate] = useState(appointment.date);
  const [startTime, setStartTime] = useState(appointment.startTime);
  const [notes, setNotes] = useState(appointment.notes);
  const [overrideSlot, setOverrideSlot] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const extrasCategory = catalog.find((c) => c.categoryName === "EXTRAS");
  const selectedService = useMemo(
    () => catalog.filter((c) => c.categoryName !== "EXTRAS").flatMap((c) => c.services).find((s) => s.id === serviceId),
    [catalog, serviceId]
  );

  const price = useMemo(() => {
    let total = selectedService?.price ?? 0;
    if (extrasCategory) {
      for (const id of extraIds) {
        const ex = extrasCategory.services.find((s) => s.id === id);
        if (ex) total += ex.price * (ex.isPerNail ? 10 : 1);
      }
    }
    return total;
  }, [selectedService, extraIds, extrasCategory]);

  function toggleExtra(id: string) {
    setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setError("");
    if (!clientName.trim()) { setError("Client name is required."); return; }
    if (!serviceId) { setError("Please select a service."); return; }
    if (!date || !startTime) { setError("Please select a date and time."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/appointments/${appointment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          serviceId,
          extraServiceIds: extraIds,
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
      router.push(`/admin/appointments/${appointment.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Appointment Details</CardTitle></CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Client Name</Label><Input className="mt-1" value={clientName} onChange={(e) => setClientName(e.target.value)} /></div>
          <div><Label>Phone</Label><Input className="mt-1" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Email</Label><Input className="mt-1" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>

        <div className="mt-4">
          <Label>Service</Label>
          <Select className="mt-1" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
            <option value="">Select a service</option>
            {catalog.filter((c) => c.categoryName !== "EXTRAS").map((cat) => (
              <optgroup key={cat.categoryName} label={cat.categoryName}>
                {cat.services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {formatPrice(s.price)}</option>
                ))}
              </optgroup>
            ))}
          </Select>
        </div>

        {extrasCategory && (
          <div className="mt-4">
            <Label>Extras</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {extrasCategory.services.map((s) => {
                const selected = extraIds.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggleExtra(s.id)} className={cn("rounded-lg border p-3 text-left text-sm", selected ? "border-accent bg-accent/10" : "border-primary/15 hover:border-accent/40")}>
                    <span className="block font-medium">{s.name}</span>
                    <span className="text-primary-dark">{s.isPerNail ? `${formatPrice(s.price)}/nail` : formatPrice(s.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><Label>Date</Label><Input type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Start Time</Label><Input type="time" className="mt-1" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
        </div>

        <div className="mt-4">
          <Label>Notes</Label>
          <Textarea className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input id="override" type="checkbox" checked={overrideSlot} onChange={(e) => setOverrideSlot(e.target.checked)} className="h-4 w-4" />
          <Label htmlFor="override" className="text-sm">Override availability (for resolving conflicts deliberately)</Label>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-4">
          <span className="text-sm text-foreground/50">Estimated price</span>
          <span className="text-lg font-semibold text-primary-dark">{formatPrice(price)}</span>
        </div>

        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push(`/admin/appointments/${appointment.id}`)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={save} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}