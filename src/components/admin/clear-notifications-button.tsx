"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClearNotificationsButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [cleared, setCleared] = useState(false);

  async function handleClear() {
    if (
      !window.confirm(
        "Clear all notification history? This cannot be undone."
      )
    )
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/notifications`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Something went wrong.");
        return;
      }
      setCleared(true);
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
      disabled={busy}
      onClick={handleClear}
    >
      {busy ? (
        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
      ) : (
        <Eraser className="mr-1 h-4 w-4" />
      )}
      {cleared ? "Cleared" : "Clear notifications"}
    </Button>
  );
}