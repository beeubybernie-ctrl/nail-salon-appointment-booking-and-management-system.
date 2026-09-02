"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export function AppointmentActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<
    "COMPLETED" | "CANCELLED" | "NO_SHOW" | "CONFIRMED" | null
  >(null);
  const [confirmLink, setConfirmLink] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function updateStatus(
    next: "COMPLETED" | "CANCELLED" | "NO_SHOW" | "CONFIRMED"
  ) {
    setBusy(next as never);
    setError("");
    setConfirmLink(null);
    try {
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      // If confirming a request, surface the WhatsApp link to message the client.
      setConfirmLink(data.clientWhatsAppLink ?? null);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function go(path: string) {
    window.location.href = path;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {status === "PENDING" && (
          <Button
            size="sm"
            variant="success"
            disabled={busy !== null}
            onClick={() => updateStatus("CONFIRMED")}
          >
            {busy === "CONFIRMED" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        )}
        {status !== "COMPLETED" && status !== "CANCELLED" && status !== "PENDING" && (
          <>
            <Button size="sm" variant="outline" onClick={() => go(`/admin/appointments/${appointmentId}/edit`)}>
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => go(`/admin/appointments/${appointmentId}/reschedule`)}>
              Reschedule
            </Button>
            <Button
              size="sm"
              variant="success"
              disabled={busy !== null}
              onClick={() => updateStatus("COMPLETED")}
            >
              {busy === "COMPLETED" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Completed
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy !== null}
              onClick={() => updateStatus("CANCELLED")}
            >
              {busy === "CANCELLED" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Cancel
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy !== null}
              onClick={() => updateStatus("NO_SHOW")}
            >
              No-show
            </Button>
          </>
        )}
        {status === "CANCELLED" && (
          <Button
            size="sm"
            variant="outline"
            disabled={busy !== null}
            onClick={() => updateStatus("CONFIRMED")}
          >
            Restore
          </Button>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {confirmLink && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3">
          <div className="flex-1 text-sm text-green-800">
            Booking confirmed. Send the confirmation to your client on WhatsApp:
          </div>
          <a href={confirmLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="whatsapp">
              <MessageCircle className="mr-1 h-4 w-4" /> Open WhatsApp
            </Button>
          </a>
        </div>
      )}
    </div>
  );
}
