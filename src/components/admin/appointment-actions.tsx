"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
  const [busy, setBusy] = useState<"COMPLETED" | "CANCELLED" | "NO_SHOW" | null>(
    null
  );
  const [error, setError] = useState("");

  async function updateStatus(
    next: "COMPLETED" | "CANCELLED" | "NO_SHOW" | "CONFIRMED"
  ) {
    setBusy(next as never);
    setError("");
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
    <div className="flex flex-wrap items-center gap-2">
      {status !== "COMPLETED" && status !== "CANCELLED" && (
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
  );
}
