"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";
import { VoucherLayout } from "@/lib/gift-voucher";

const FONT_FAMILY: Record<string, string> = {
  sans: "system-ui, sans-serif",
  serif: "Georgia, serif",
  mono: "ui-monospace, monospace",
};

export function VoucherPngDownload({
  voucherNo,
  amountLabel,
  recipientName,
  buyerName,
  validUntil,
  layout,
  filename,
}: {
  voucherNo: string;
  amountLabel: string;
  recipientName: string;
  buyerName?: string | null;
  validUntil: string;
  layout: VoucherLayout;
  filename: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const fieldStyle = (f: VoucherLayout[keyof VoucherLayout]) => ({
    left: `${f.x}%`,
    top: `${f.y}%`,
    fontSize: `${f.size}px`,
    fontFamily: FONT_FAMILY[f.font] ?? FONT_FAMILY.sans,
    fontWeight: "normal",
    color: "#a67c4e",
  });

  async function download() {
    if (!ref.current) return;
    setBusy(true);
    try {
      const node = ref.current;
      const dataUrl = await toPng(node, {
        width: 1536,
        height: 1024,
        pixelRatio: 1,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Could not generate the voucher image. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Off-screen (but rendered) voucher for capture; same as the view */}
      <div
        ref={ref}
        className="absolute overflow-hidden"
        style={{ width: 1536, height: 1024, left: -99999, top: 0 }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/voucher-template.png"
          alt=""
          width={1536}
          height={1024}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ position: "absolute", ...fieldStyle(layout.amount), textAlign: "right" }}>
            {amountLabel}
          </div>
          <div style={{ position: "absolute", ...fieldStyle(layout.to) }}>{recipientName}</div>
          {buyerName && (
            <div style={{ position: "absolute", ...fieldStyle(layout.from) }}>{buyerName}</div>
          )}
          <div style={{ position: "absolute", ...fieldStyle(layout.voucherNo), textAlign: "right" }}>
            {voucherNo}
          </div>
          <div style={{ position: "absolute", ...fieldStyle(layout.validUntil) }}>{validUntil}</div>
        </div>
      </div>

      <button
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? "Generating…" : "Download PNG"}
      </button>
    </div>
  );
}
