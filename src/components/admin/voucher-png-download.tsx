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
      if (!node) throw new Error("Voucher not found");

      // Capture the visible voucher card exactly as rendered on screen.
      // A uniform integer scale keeps template + text perfectly proportional,
      // so what you download is literally what you see (just sharper).
      const canvas = await html2canvas(node, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        imageTimeout: 30000,
        logging: false,
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
