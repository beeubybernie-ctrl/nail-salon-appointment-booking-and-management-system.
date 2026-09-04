"use client";

import { useState } from "react";
import { Trash2, Trash } from "lucide-react";
import { useRouter } from "next/navigation";

export function DeleteVoucherButton({ voucherId }: { voucherId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this voucher? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gift-vouchers/${voucherId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete voucher.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete voucher.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}

export function ClearAllVouchersButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    if (!confirm("Clear ALL gift vouchers? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/gift-vouchers/clear", { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const body = await res.json().catch(() => null);
        alert(body?.error || "Failed to clear vouchers.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to clear vouchers.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClear}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      <Trash className="h-3.5 w-3.5" />
      {loading ? "Clearing…" : "Clear All"}
    </button>
  );
}