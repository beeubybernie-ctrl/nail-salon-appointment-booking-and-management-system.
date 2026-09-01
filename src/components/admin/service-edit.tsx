"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditServiceForm({
  serviceId,
  name,
  price,
  duration,
  isPerNail,
  isActive,
}: {
  serviceId: string;
  name: string;
  price: number;
  duration: number;
  isPerNail: boolean;
  isActive: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [priceValue, setPriceValue] = useState(price.toString());
  const [durationValue, setDurationValue] = useState(duration.toString());
  const [activeValue, setActiveValue] = useState(isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: parseInt(priceValue, 10) || 0,
          duration: parseInt(durationValue, 10) || 0,
          isActive: activeValue,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
      <p className="mb-2 text-sm font-medium">{name}</p>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Price (R)</Label>
          <Input
            type="number"
            className="mt-1 h-9"
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Duration (minutes)</Label>
          <Input
            type="number"
            className="mt-1 h-9"
            value={durationValue}
            onChange={(e) => setDurationValue(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={activeValue}
            onChange={(e) => setActiveValue(e.target.checked)}
            className="h-4 w-4"
          />
          <Label className="text-xs">Active (available for booking)</Label>
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}