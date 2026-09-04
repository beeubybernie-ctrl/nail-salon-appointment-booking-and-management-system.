"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { VoucherLayout } from "@/lib/gift-voucher";

const W = 1536;
const H = 1024;
const GOLD = "#a67c4e";

const FONT_FAMILY: Record<string, string> = {
  sans: "'Segoe UI', Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
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
  const [busy, setBusy] = useState(false);

  const drawField = (
    ctx: CanvasRenderingContext2D,
    f: VoucherLayout[keyof VoucherLayout],
    text: string,
    alignRight = false
  ) => {
    ctx.font = `400 ${f.size}px ${FONT_FAMILY[f.font] ?? FONT_FAMILY.sans}`;
    ctx.fillStyle = GOLD;
    ctx.textBaseline = "top";
    ctx.textAlign = alignRight ? "right" : "left";
    let x = (f.x / 100) * W;
    if (alignRight) x += 6; // small right padding to sit just left of the label
    ctx.fillText(text, x, (f.y / 100) * H);
  };

  async function download() {
    setBusy(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("no 2d context");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "/images/voucher-template.png";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("template failed to load"));
      });
      ctx.drawImage(img, 0, 0, W, H);

      drawField(ctx, layout.amount, amountLabel, true);
      drawField(ctx, layout.to, recipientName);
      if (buyerName) drawField(ctx, layout.from, buyerName);
      drawField(ctx, layout.voucherNo, voucherNo, true);
      drawField(ctx, layout.validUntil, validUntil);

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
      {busy ? "Generating…" : "Download PNG"}
    </button>
  );
}
