"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";
import { VoucherLayout } from "@/lib/gift-voucher";

const W = 1536;
const H = 1024;

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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/voucher-template.png";
    img.onload = () => setReady(true);
    img.onerror = () => setReady(true);
  }, []);

  const textStyle = (f: VoucherLayout[keyof VoucherLayout], alignRight = false) => ({
    position: "absolute" as const,
    left: `${f.x}%`,
    top: `${f.y}%`,
    fontSize: `${f.size}px`,
    fontFamily:
      f.font === "mono"
        ? "ui-monospace, 'Courier New', monospace"
        : f.font === "serif"
        ? "Georgia, serif"
        : "Arial, Helvetica, sans-serif",
    fontWeight: 400,
    color: "#a67c4e",
    lineHeight: 1,
    whiteSpace: "nowrap" as const,
    textAlign: alignRight ? "right" as const : "left" as const,
  });

  async function download() {
    if (!captureRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        width: W,
        height: H,
        windowWidth: W,
        windowHeight: H,
        scale: 1,
        useCORS: true,
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
    <>
      <div
        ref={captureRef}
        aria-hidden
        className="absolute"
        style={{ width: W, height: H, left: -99999, top: 0, overflow: "hidden", background: "transparent" }}
      >
        {ready && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/images/voucher-template.png"
            alt=""
            width={W}
            height={H}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0 }}>
          <div style={textStyle(layout.amount, true)}>{amountLabel}</div>
          <div style={textStyle(layout.to)}>{recipientName}</div>
          {buyerName && <div style={textStyle(layout.from)}>{buyerName}</div>}
          <div style={textStyle(layout.voucherNo, true)}>{voucherNo}</div>
          <div style={textStyle(layout.validUntil)}>{validUntil}</div>
        </div>
      </div>

      <button
        onClick={download}
        disabled={busy || !ready}
        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10 disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" />
        {busy ? "Rendering…" : !ready ? "Preparing…" : "Download PNG"}
      </button>
    </>
  );
}
