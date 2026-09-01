"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BlockedTimeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) { setError("Title is required."); return; }
    if (!date || !start || !end) { setError("Date and times are required."); return; }
    if (start >= end) { setError("End time must be after start time."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/blocked-time", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), date, startTime: start, endTime: end, notes: notes.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setTitle(""); setDate(""); setStart(""); setEnd(""); setNotes("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Add Blocked Time</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="bt-title">Title</Label>
            <Input id="bt-title" className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Personal appointment, Holiday, Maintenance" />
          </div>
          <div>
            <Label htmlFor="bt-date">Date</Label>
            <Input id="bt-date" type="date" className="mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bt-start">Start</Label>
              <Input id="bt-start" type="time" className="mt-1" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bt-end">End</Label>
              <Input id="bt-end" type="time" className="mt-1" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="bt-notes">Notes (optional)</Label>
            <Textarea id="bt-notes" className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Block Time
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}