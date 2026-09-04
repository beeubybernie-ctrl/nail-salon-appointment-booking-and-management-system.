/**
 * Minimal dependency-free PDF generator (uses only the built-in Helvetica
 * font, plus PNG image embedding via the FlateDecode filter — nothing to
 * download at build/runtime).
 */
import { readFileSync } from "fs";
import path from "path";
import zlib from "zlib";
import { BUSINESS } from "./business";
import { voucherAmountLabel, validUntilParts, VoucherLayout } from "./gift-voucher";

const PAGE_W = 595; // A4 portrait
const PAGE_H = 842;

const DEFAULT_LAYOUT: VoucherLayout = {
  amount: { x: 75, y: 5, size: 18, font: "sans" },
  to: { x: 30, y: 40, size: 18, font: "sans" },
  from: { x: 30, y: 55, size: 18, font: "sans" },
  voucherNo: { x: 5, y: 85, size: 14, font: "mono" },
  validUntil: { x: 70, y: 85, size: 16, font: "sans" },
};

function escapeText(s: string): string {
  return s.toString()
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[éÉ]/g, "e")
    .replace(/[èÈ]/g, "e")
    .replace(/[àÀ]/g, "a")
    .replace(/[íÍ]/g, "i")
    .replace(/[óÓ]/g, "o")
    .replace(/[úÚ]/g, "u")
    .replace(/[ñÑ]/g, "n")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“|”/g, '"');
}

/**
 * Decode a PNG file into raw RGB pixel data + dimensions so it can be
 * embedded in the PDF as an image XObject. Supports 8-bit greyscale,
 * truecolor (RGB), and RGB-with-alpha (alpha discarded), all with or
 * without palette / interlace (non-interlaced only).
 */
function decodePng(buffer: Buffer): {
  width: number;
  height: number;
  rgb: Buffer;
} {
  if (buffer.readUInt32BE(0) !== 0x89504e47) throw new Error("Not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let idat: Buffer[] = [];
  let interlace = 0;

  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
      interlace = data.readUInt8(12);
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    pos += 12 + len;
  }

  if (bitDepth !== 8) {
    if (colorType === 0 && bitDepth === 8) {
      // ok greyscale 8
    } else if (bitDepth === 16) {
      throw new Error("16-bit PNG not supported");
    } else if (colorType === 3 && bitDepth === 8) {
      // palette 8 ok
    } else {
      throw new Error(`Unsupported PNG bit depth ${bitDepth} color ${colorType}`);
    }
  }
  if (interlace !== 0) throw new Error("Interlaced PNG not supported");

  const raw = zlib.inflateSync(Buffer.concat(idat));

  // bytes per pixel based on color type
  const ch =
    colorType === 0 ? 1 : colorType === 2 ? 3 : colorType === 4 ? 2 : colorType === 6 ? 4 : 1;
  const stride = width * ch;
  const out = Buffer.alloc(width * height * 3);

  // unfilter each scanline
  let prev: Buffer = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const cur = Buffer.from(line);
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? cur[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = cur[i];
      switch (filter) {
        case 0:
          break;
        case 1:
          v = (v + a) & 0xff;
          break;
        case 2:
          v = (v + b) & 0xff;
          break;
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff;
          break;
        case 4:
          {
            const p = a + b - c;
            let pa = Math.abs(p - a);
            let pb = Math.abs(p - b);
            let pc = Math.abs(p - c);
            v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 0xff;
          }
          break;
      }
      cur[i] = v;
    }
    // write RGB pixels
    for (let x = 0; x < width; x++) {
      const src = x * ch;
      let r = 0, g = 0, b = 0;
      if (colorType === 2 || colorType === 6) {
        r = cur[src]; g = cur[src + 1]; b = cur[src + 2];
      } else if (colorType === 0) {
        r = g = b = cur[src];
      } else if (colorType === 3) {
        // need palette — not handled; treat as greyscale fallback
        r = g = b = cur[src];
      } else if (colorType === 4) {
        r = g = b = cur[src];
      }
      const o = (y * width + x) * 3;
      out[o] = r; out[o + 1] = g; out[o + 2] = b;
    }
    prev = cur;
  }

  return { width, height, rgb: out };
}

/**
 * Build a single-voucher PDF ticket that uses the saved template image as a
 * full-page background and overlays the voucher values (per the layout).
 */
export function buildVoucherTicketPdf(x: {
  voucherNo: string;
  amount: number;
  recipientName: string;
  buyerName?: string | null;
  validUntil: Date;
  purchasedAt?: Date;
  message?: string | null;
  layout?: VoucherLayout;
}): Buffer {
  const W = 768; // ticket — matches template aspect ratio 1536:1024
  const H = 512;

  const layout = { ...DEFAULT_LAYOUT, ...(x.layout ?? {}) };

  // scale percentage coords to PDF points
  const px = (pct: number) => (pct / 100) * W;
  const py = (pct: number) => (pct / 100) * H;

  const H_ = (y: number) => H - y;

  const draw: string[] = [];

  let imgName: string | null = null;
  let imgDims: { width: number; height: number; rgb: Buffer } | null = null;

  try {
    const templatePath = path.join(process.cwd(), "public", "images", "voucher-template.png");
    const png = readFileSync(templatePath);
    imgDims = decodePng(png);
    imgName = "I1";
    const w = imgDims.width;
    const h = imgDims.height;
    void w;
    void h;

    // Render the background image stretched to the full page.
    draw.push(`q`);
    draw.push(`${W} 0 0 ${H} 0 0 cm`);
    draw.push(`/${imgName} Do`);
    draw.push(`Q`);
  } catch {
    // image missing — fall back to a plain background
    draw.push(`0 0 ${W} ${H} re f`);
  }

  // Overlay values on the template — gold color to match view, regular font
  const GOLD = "0.65 0.49 0.31 rg";

  // helper to draw a single line of text
  const reg = (font: number, size: number, xp: number, yp: number, str: string) =>
    `BT /F${font} ${size} Tf ${GOLD} ${xp} ${H_(yp)} Td (${escapeText(str)}) Tj ET`;

  // Amount
  draw.push(reg(1, layout.amount.size, px(layout.amount.x), py(layout.amount.y) + layout.amount.size * 0.8, voucherAmountLabel(x.amount)));

  // To
  draw.push(reg(1, layout.to.size, px(layout.to.x), py(layout.to.y) + layout.to.size * 0.8, x.recipientName));

  // From
  if (x.buyerName) {
    draw.push(reg(1, layout.from.size, px(layout.from.x), py(layout.from.y) + layout.from.size * 0.8, x.buyerName));
  }

  // Voucher no
  draw.push(reg(1, layout.voucherNo.size, px(layout.voucherNo.x), py(layout.voucherNo.y) + layout.voucherNo.size * 0.8, x.voucherNo));

  // Valid until — draw day / month / year using RELATIVE Td offsets so each
  // segment lands correctly (Td is relative to the current text position).
  const parts = validUntilParts(x.validUntil);
  const dSize = layout.validUntil.size;
  const dX = px(layout.validUntil.x);
  const dY = py(layout.validUntil.y) + dSize * 0.8;
  const tdv = `0 ${H_(dY)} Td`;
  const seg = dSize; // approx width of a "dd" segment
  const slash = 10; // small gap + slash
  draw.push(`BT /F1 ${dSize} Tf ${GOLD} ${dX} ${H_(dY)} Td (${parts.day}) Tj`);
  draw.push(`${seg + slash} 0 Td (/) Tj`);
  draw.push(`${slash + seg + slash} 0 Td (${parts.month}) Tj`);
  draw.push(`${seg + slash} 0 Td (/) Tj`);
  draw.push(`${slash + seg + slash} 0 Td (${parts.year}) Tj`);
  draw.push(`ET`);
  void tdv;

  const contentBody = draw.join("\n");

  const fontHelv = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const fontBold = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  // Assemble objects
  const objs: string[] = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";

  if (imgName && imgDims) {
    const compressedImg = zlib.deflateSync(imgDims.rgb);
    objs[4] = `<< /Length ${contentBody.length} >>\nstream\n${contentBody}\nendstream`;
    objs[5] = fontHelv;
    objs[6] = fontBold;
    objs[7] = `<< /Type /XObject /Subtype /Image /Width ${imgDims.width} /Height ${imgDims.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressedImg.length} >>\nstream\n${compressedImg.toString("latin1")}\nendstream`;
    objs[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /I1 7 0 R >> >> /Contents 4 0 R >>`;
  } else {
    objs[4] = `<< /Length ${contentBody.length} >>\nstream\n${contentBody}\nendstream`;
    objs[5] = fontHelv;
    objs[6] = fontBold;
    objs[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`;
  }

  let body = "";
  const offsets: number[] = [];
  const total = imgName ? 8 : 7;
  for (let i = 1; i < total; i++) {
    offsets[i] = body.length;
    body += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const finalPdf = "%PDF-1.4\n" + body;
  const xrefPos = finalPdf.length;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let i = 1; i < total; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  return Buffer.from(finalPdf + xref + `trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`, "latin1");
}

/**
 * Build a multi-page PDF listing vouchers. Returns full PDF bytes.
 */
export function buildVoucherListPdf(
  rows: {
    voucherNo: string;
    recipientName: string;
    amount: number;
    status: string;
    purchasedAt: Date;
    validUntil: Date;
  }[]
): Buffer {
  const W = 595;
  const H = 842;

  const statusOk = (s: string) => ({
    REQUESTED: "Requested",
    PAID: "Paid",
    SENT: "Sent",
    REDEEMED: "Redeemed",
    CANCELLED: "Cancelled",
  }[s] || s);

  const headers = ["Voucher No", "Recipient", "Value", "Status", "Purchased", "Valid Until"];

  const perPage = 26;
  const pages: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    pages.push(rows.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push([]);

  const objects: { body: string }[] = [{ body: "%PDF placeholder" }];

  const pushObj = (body: string) => {
    objects.push({ body });
    return objects.length - 1;
  };

  pushObj("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = pushObj("<< /Type /Pages /Kids [] /Count 0 >>");

  const fontHelv = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const fontBold = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const fontId = pushObj(fontHelv);
  const fontBoldId = pushObj(fontBold);

  let running = 4;
  const pageObjectIds: number[] = [];
  for (let p = 0; p < pages.length; p++) {
    const contentBody = renderPageContent(pages[p], W, H, headers, statusOk);
    pushObj(`<< /Length ${contentBody.length} >>\nstream\n${contentBody}\nendstream`);
    const pageId = running + 2;
    pushObj(`<< /Type /Page /Parent 3 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${running + 1} 0 R >>`);
    pageObjectIds.push(pageId);
    running += 2;
  }
  objects[pagesId].body = `<< /Type /Pages /Kids [${pageObjectIds.join(" ")} 0 R] /Count ${pageObjectIds.length} >>`;

  let body = "";
  const offsets: number[] = [];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = body.length;
    body += `${i} 0 obj\n${objects[i].body}\nendobj\n`;
  }

  let pdf = "%PDF-1.4\n" + body;
  const xrefPos = pdf.length;
  const count = objects.length;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += xref + `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

function renderPageContent(
  pageRows: { voucherNo: string; recipientName: string; amount: number; status: string; purchasedAt: Date; validUntil: Date }[],
  W: number,
  H: number,
  headers: string[],
  statusOk: (s: string) => string
): string {
  const draw: string[] = [];
  const left = 40;
  let y = 60;
  const lineH = 22;
  const H_ = (yy: number) => H - yy;

  draw.push(`BT /F2 18 Tf 0.10 0.20 0.45 rg ${left} ${H_(y)} Td (${escapeText(`${BUSINESS.name} — Gift Vouchers`)}) Tj ET`);
  y += 30;

  const cols = [100, 120, 80, 90, 130, 130];
  let cx = left;
  draw.push(`BT /F2 10 Tf 0 0 0 rg`);
  for (let i = 0; i < headers.length; i++) {
    draw.push(`${cx} ${H_(y)} Td (${escapeText(headers[i])}) Tj`);
    cx += cols[i];
  }
  draw.push(`ET`);
  y += 8;
  draw.push(`0.7 0.7 0.7 RG ${left} ${H_(y)} ${W - 80} 0 re S`);
  y += 16;

  for (const r of pageRows) {
    draw.push(`BT /F1 10 Tf 0.15 0.15 0.15 rg`);
    cx = left;
    const cells = [
      r.voucherNo,
      r.recipientName,
      voucherAmountLabel(Number(r.amount)),
      statusOk(r.status),
      new Date(r.purchasedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
      new Date(r.validUntil).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }),
    ];
    for (let i = 0; i < cells.length; i++) {
      draw.push(`${cx} ${H_(y)} Td (${escapeText(cells[i])}) Tj`);
      cx += cols[i];
    }
    draw.push(`ET`);
    y += lineH;
  }

  return draw.join("\n");
}