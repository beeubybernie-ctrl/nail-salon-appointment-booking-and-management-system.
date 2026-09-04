import sharp from "sharp";
import {
  VoucherLayout,
  voucherAmountLabel,
  validUntilParts,
  FieldPos,
} from "./gift-voucher";

const TEMPLATE_PATH = `${process.cwd()}/public/images/voucher-template.png`;
const GOLD = "#a67c4e";

const FONT_FAMILY: Record<string, string> = {
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "'Courier New', monospace",
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function line(
  field: FieldPos,
  text: string,
  anchor: "start" | "end" = "start"
): string {
  const ff = FONT_FAMILY[field.font] ?? FONT_FAMILY.sans;
  // x/y are percentages of the 1536x1024 canvas. dominant-baseline:hanging
  // places the top of the text at y%, matching the view's top:y%.
  return `<text x="${field.x}%" y="${field.y}%" text-anchor="${anchor}" dominant-baseline="hanging" font-family="${ff}" font-size="${field.size}" font-weight="normal" fill="${GOLD}">${esc(text)}</text>`;
}

/**
 * Build an SVG containing only the golden value text at the saved layout
 * positions (transparent background). This is composited on top of the
 * template image to produce the final voucher.
 */
export function buildVoucherTextSvg(input: {
  voucherNo: string;
  amount: number;
  recipientName: string;
  buyerName?: string | null;
  validUntil: Date;
  layout: VoucherLayout;
}): string {
  const { voucherNo, amount, recipientName, buyerName, layout } = input;
  const parts = validUntilParts(input.validUntil);

  const amountText = voucherAmountLabel(amount);
  // The view renders dd / mm / yyyy with small gaps around the slashes.
  const validUntilText = `${parts.day} / ${parts.month} / ${parts.year}`;

  const els: string[] = [
    line(layout.amount, amountText, "end"),
    line(layout.to, recipientName),
  ];
  if (buyerName) els.push(line(layout.from, buyerName));
  els.push(line(layout.voucherNo, voucherNo, "end"));
  els.push(line(layout.validUntil, validUntilText));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="1024" viewBox="0 0 1536 1024">
  ${els.join("\n  ")}
</svg>`;
}

/**
 * Combine the template image with the golden value text and rasterize to PNG.
 * Mirrors the on-screen voucher (same percentages, native 1536x1024).
 */
export async function buildVoucherPng(input: Parameters<typeof buildVoucherTextSvg>[0]): Promise<Buffer> {
  const textSvg = buildVoucherTextSvg(input);
  return sharp(TEMPLATE_PATH)
    .composite([{ input: Buffer.from(textSvg), gravity: "northwest" }])
    .png()
    .toBuffer();
}
