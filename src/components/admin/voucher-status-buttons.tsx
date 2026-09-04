"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
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

  async function setStatus(status: string) {
    const res = await fetch(`/api/admin/gift-vouchers/${voucherId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Something went wrong.");
      return;
    }
    router.refresh();
  }

  const next = NEXT_STEP[currentStatus];

  return (
    <>
      {next && (
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setStatus(next.status)}
        >
          <Check className="h-3.5 w-3.5" /> {next.label}
        </Button>
      )}
      {currentStatus !== "CANCELLED" && currentStatus !== "REQUESTED" && (
        <Button
          size="sm"
          variant="outline"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
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