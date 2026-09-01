"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, CalendarX2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, formatTime24to12 } from "@/lib/business";

interface CancelAppointment {
  bookingRef: string;
  clientName: string;
  serviceName: string;
  extras: { name: string; quantity: number; total: number }[];
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: string;
}

export default function CancelPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<CancelAppointment | null>(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/appointments/cancel/${token}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "This link is not valid.");
        setAppointment(null);
      } else {
        setAppointment(data.appointment);
        setError("");
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

  async function confirmCancel() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/cancel/${token}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setCancelling(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setCancelling(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-12">
      <div className="text-center">
        <h1 className="font-serif-display text-2xl font-semibold">
          Cancel Appointment
        </h1>
        <p className="mt-2 text-sm text-foreground/60">Bee-U by Bernie</p>
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
            <h2 className="mt-4 text-lg font-semibold">Appointment Cancelled</h2>
            <p className="mt-2 text-sm text-foreground/60">
              Your time slot has been released. We hope to see you again soon.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link href="/book">
                <Button className="w-full">Book a new appointment</Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="w-full">Back to home</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !done && appointment && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarX2 className="h-5 w-5 text-red-500" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-foreground/50">Reference</span><span className="font-medium">{appointment.bookingRef}</span></div>
            <div className="flex justify-between"><span className="text-foreground/50">Service</span><span className="font-medium">{appointment.serviceName}</span></div>
            {appointment.extras.length > 0 && (
              <div className="flex justify-between"><span className="text-foreground/50">Extras</span><span className="font-medium">{appointment.extras.map((e) => `${e.name}${e.quantity > 1 ? ` ×${e.quantity}` : ""}`).join(", ")}</span></div>
            )}
            <div className="flex justify-between">
              <span className="text-foreground/50">Date</span>
              <span className="font-medium">
                {new Date(appointment.date).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/50">Time</span>
              <span className="font-medium">{formatTime24to12(appointment.startTime)} – {formatTime24to12(appointment.endTime)}</span>
            </div>
            <div className="flex justify-between"><span className="text-foreground/50">Price</span><span className="font-medium">{formatPrice(appointment.price)}</span></div>

            {error && <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600">{error}</p>}

            <div className="pt-2">
              <Button
                variant="destructive"
                className="w-full"
                onClick={confirmCancel}
                disabled={cancelling}
              >
                {cancelling ? <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</> : "I want to cancel this appointment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}