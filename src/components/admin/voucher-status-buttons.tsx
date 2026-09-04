"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const NEXT_STEP: Record<string, { status: string; label: string } | null> = {
  REQUESTED: { status: "PAID", label: "Mark as Paid" },
  PAID: { status: "SENT", label: "Mark as Sent" },
  SENT: { status: "REDEEMED", label: "Mark Redeemed" },
  REDEEMED: null,
  CANCELLED: null,
};

export function VoucherStatusButtons({
  voucherId,
  currentStatus,
}: {
  voucherId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/gift-vouchers/${voucherId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Voucher status update failed:", res.status, data);
        alert(data.error ?? `Failed to update status (${res.status}). Please try again.`);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("Voucher status update error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const next = NEXT_STEP[currentStatus];

  return (
    <>
      {next && (
        <Button
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => setStatus(next.status)}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          {next.label}
        </Button>
      )}
      {currentStatus !== "CANCELLED" && currentStatus !== "REQUESTED" && (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Cancel this voucher?")) setStatus("CANCELLED");
          }}
        >
          Cancel
        </Button>
      )}
    </>
  );
}