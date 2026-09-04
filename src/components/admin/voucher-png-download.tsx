"use client";

import { useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

export function VoucherPngDownload({ filename }: { filename: string }) {
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const node = document.querySelector<HTMLElement>("[data-voucher-card]");
      if (!node) throw new Error("Voucher card not found");

      // Target the width of the element as rendered; scale up for a crisp
      // 1536px-wide export so it looks just like the on-screen voucher.
      const targetWidth = node.offsetWidth || 1536;
      const scale = 1536 / targetWidth;

      const canvas = await html2canvas(node, {
        scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        imageTimeout: 30000,
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error(err);
      alert("Could not generate the voucher image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10 disabled:opacity-50"
    >
      <Download className="h-3.5 w-3.5" />
      {busy ? "Rendering…" : "Download PNG"}
    </button>
  );
}
