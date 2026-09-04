"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { VoucherLayout } from "@/lib/gift-voucher";

const W = 1536;
const H = 1024;

const FONT_FAMILY: Record<string, string> = {
  sans: "system-ui, system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, 'Courier New', monospace",
};

const fieldStyle = (f: VoucherLayout[keyof VoucherLayout]) => ({
  left: `${f.x}%`,
  top: `${f.y}%`,
  fontSize: `${f.size}px`,
  fontFamily: FONT_FAMILY[f.font] ?? FONT_FAMILY.sans,
  fontWeight: 400,
  color: "#a67c4e",
  position: "absolute" as const,
  lineHeight: 1.2,
});

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
  const captureRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  // Render the voucher at native 1536x1024 only after the template is loaded,
  // so screenshots never capture a blank/partial image.
  const [templateLoaded, setTemplateLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/voucher-template.png";
    img.onload = () => setTemplateLoaded(true);
    img.onerror = () => setTemplateLoaded(true); // let html2canvas try anyway
  }, []);

  async function download() {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        width: W,
        height: H,
        scale: 1,
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
    <>
      {/* Native-size voucher used only for the screenshot; no DOM scaling. */}
      <div
        ref={captureRef}
        className="absolute"
        aria-hidden
        style={{ width: W, height: H, left: -99999, top: 0, overflow: "hidden" }}
      >
        {templateLoaded && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/voucher-template.png"
            alt=""
            width={W}
            height={H}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={{ ...fieldStyle(layout.amount), textAlign: "right" }}>{amountLabel}</div>
          <div style={fieldStyle(layout.to)}>{recipientName}</div>
          {buyerName && <div style={fieldStyle(layout.from)}>{buyerName}</div>}
          <div style={{ ...fieldStyle(layout.voucherNo), textAlign: "right" }}>{voucherNo}</div>
          <div style={fieldStyle(layout.validUntil)}>{validUntil}</div>
        </div>
      </div>

      <button
        onClick={download}
        disabled={busy || !templateLoaded}
        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? "Rendering…" : !templateLoaded ? "Preparing…" : "Download PNG"}
      </button>
    </>
  );
}
