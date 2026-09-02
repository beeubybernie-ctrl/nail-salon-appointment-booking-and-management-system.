"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ConfirmAppointmentButton({
  appointmentId,
  variant = "default",
  size = "default",
  className,
}: {
  appointmentId: string;
  variant?: "default" | "success" | "outline";
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CONFIRMED" }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Something went wrong.");
        return;
      }
      setLink(data.clientWhatsAppLink ?? null);
      router.refresh();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={busy}
        onClick={confirm}
      >
        {busy ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <Check className="mr-1 h-4 w-4" />
        )}
        Confirm
      </Button>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-green-700 hover:underline"
        >
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp client now
        </a>
      )}
    </div>
  );
}