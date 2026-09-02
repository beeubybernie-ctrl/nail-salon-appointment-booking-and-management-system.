"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Day {
  date: string;
  isOpen: boolean;
  slotCount: number;
}

export function AvailabilityMiniCalendar() {
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/availability/overview?days=14", {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && res.ok && data.days) {
          setDays(data.days);
        } else if (active) {
          setError(true);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-accent" />
          Availability This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-foreground/50">
            <Loader2 className="h-5 w-5 animate-spin" /> Checking availability...
          </div>
        )}

        {error && !loading && (
          <p className="rounded-xl bg-primary/5 p-4 text-sm text-foreground/60">
            Availability is temporarily unavailable. Please use the booking page
            to see live times.
          </p>
        )}

        {!loading && !error && days.length === 0 && (
          <p className="rounded-xl bg-primary/5 p-4 text-sm text-foreground/60">
            No booking dates are currently available.
          </p>
        )}

        {!loading && !error && days.length > 0 && (
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const date = new Date(`${d.date}T00:00:00`);
              const dayName = date.toLocaleDateString("en-ZA", {
                weekday: "short",
              });
              const dayNum = date.getDate();
              const closed = !d.isOpen;
              const full = d.isOpen && d.slotCount === 0;
              const available = d.isOpen && d.slotCount > 0;
              return (
                <div
                  key={d.date}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-2 text-center",
                    available
                      ? "border-green-300 bg-green-50"
                      : full
                        ? "border-red-200 bg-red-50"
                        : "border-primary/10 bg-primary/5 opacity-50"
                  )}
                  title={available ? `${d.slotCount} spots` : closed ? "Closed" : "Fully booked"}
                >
                  <span className="text-[10px] font-medium uppercase text-foreground/50">
                    {dayName}
                  </span>
                  <span className="mt-0.5 text-sm font-semibold">{dayNum}</span>
                  <span
                    className={cn(
                      "mt-0.5 text-[10px] font-medium",
                      available
                        ? "text-green-700"
                        : full
                          ? "text-red-600"
                          : "text-foreground/40"
                    )}
                  >
                    {closed ? "Closed" : full ? "Full" : `${d.slotCount}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-primary/10 pt-4">
          <div className="flex items-center gap-3 text-[11px] text-foreground/50">
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-green-300 bg-green-50" /> Open
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-red-200 bg-red-50" /> Full
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded border border-primary/10 bg-primary/5 opacity-50" /> Closed
            </span>
          </div>
          <Link href="/book">
            <Button size="sm" variant="outline">
              Book a spot
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}