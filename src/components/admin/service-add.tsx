"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryOption {
  id: string;
  name: string;
}

export function AddServiceForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    duration: "",
    categoryId: categories[0]?.id ?? "",
    isPerNail: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: form.price,
          duration: form.duration,
          categoryId: form.categoryId,
          isPerNail: form.isPerNail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setOpen(false);
      setForm({ name: "", price: "", duration: "", categoryId: categories[0]?.id ?? "", isPerNail: false });
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Add Service
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Add a New Service</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="svc-name">Service name</Label>
            <Input
              id="svc-name"
              className="mt-1"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="e.g. Deluxe Manicure"
            />
          </div>
          <div>
            <Label htmlFor="svc-cat">Category</Label>
            <select
              id="svc-cat"
              className="mt-1 w-full rounded-xl border border-primary/15 px-3 py-2 text-sm"
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="svc-price">Price (R)</Label>
            <Input
              id="svc-price"
              type="number"
              min={0}
              className="mt-1"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
          <div>
            <Label htmlFor="svc-dur">Duration (minutes)</Label>
            <Input
              id="svc-dur"
              type="number"
              min={0}
              className="mt-1"
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="0 for add-ons, else e.g. 120"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="svc-pernail"
            type="checkbox"
            checked={form.isPerNail}
            onChange={(e) => update("isPerNail", e.target.checked ? "true" : "false")}
            className="h-4 w-4"
          />
          <Label htmlFor="svc-pernail" className="text-sm">
            Per nail (e.g. chrome, art)
          </Label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            {saving ? "Adding..." : "Add Service"}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}