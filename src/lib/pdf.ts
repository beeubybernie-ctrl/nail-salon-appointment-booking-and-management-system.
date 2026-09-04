/**
 * Minimal dependency-free PDF generator (uses only the built-in Helvetica
 * font, so no native deps and nothing to download at build/runtime).
 *
 * Produces clean, printable A4 documents used for gift-voucher downloads and
 * voucher-list exports.
 */
import { BUSINESS } from "./business";
import { voucherAmountLabel } from "./gift-voucher";

const PAGE_W = 595; // A4 landscape? use portrait
const PAGE_H = 842;

function escapeText(s: string): string {
  return s.toString()
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    // Map common unicode to WinAnsi approximations (é, –, ’ …)
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

function header(): string {
  return `1 0 0 1 0 0 cm
q
BT
/F1 13 Tf
0.10 0.20 0.45 rg
1 1 1 rg
0 0 0 rg`;
}

/**
 * Build a single-voucher PDF ticket. Returns the full PDF bytes.
 */
export function buildVoucherTicketPdf(x: {
  voucherNo: string;
  amount: number;
  recipientName: string;
  validUntil: Date;
  purchasedAt?: Date;
  message?: string | null;
}): Buffer {
  const W = 842; // ticket (landscape-ish)
  const H = 420;
  const H_ = (y: number) => H - y;

  const draw: string[] = [];
  const f = (font: "F1" | "F2", size: number, xp: number, yp: number, color: string, str: string) => {
    draw.push(`BT /${font} ${size} Tf ${color} rg ${xp} ${H_(yp)} Td (${escapeText(str)}) Tj ET`);
  };

  draw.push(`0 0 ${W} ${H} re f`);
  draw.push(`0.95 0.95 0.95 rg`);
  draw.push(`20 20 ${W - 40} ${H - 40} re f`);

  let y = 40;
  f("F2", 30, (W / 2) - 130, y, "0.10 0.20 0.45", BUSINESS.name);
  y += 32;
  f("F1", 13, (W / 2) - 80, y, "0.45 0.45 0.45", "Be You. Be Beautiful.");
  y += 44;

  f("F2", 20, 40, y, "0 0 0", "GIFT VOUCHER");
  f("F1", 13, 40, y + 24, "0.45 0.45 0.45", `Voucher No: ${x.voucherNo}`);
  y += 58;

  draw.push(`BT /F2 42 Tf 0.85 0.30 0.10 rg 60 ${H_(y)} Td (${escapeText(voucherAmountLabel(x.amount))}) Tj ET`);
  y += 56;

  f("F1", 14, 40, y, "0 0 0", `For: ${x.recipientName}`);
  y += 24;
  f("F1", 12, 40, y, "0.30 0.30 0.30", `Purchased: ${x.purchasedAt ? x.purchasedAt.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }) : "—"}`);
  y += 20;
  f("F1", 12, 40, y, "0.30 0.30 0.30", `Valid until: ${new Date(x.validUntil).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`);
  y += 34;
  if (x.message) {
    f("F1", 11, 40, y, "0.30 0.30 0.30", `Message: ${x.message}`);
    y += 20;
  }
  f("F1", 11, 40, y, "0.30 0.30 0.30", "Present this voucher at Bee-U by Bernie to redeem.");

  const contentBody = draw.join("\n");

  const fontHelv = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const fontBold = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
  const contentId = "<< /Length ${contentBody.length} >>\nstream\n${contentBody}\nendstream";

  const objs: string[] = [];
  objs[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objs[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objs[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`;
  objs[4] = `<< /Length ${contentBody.length} >>\nstream\n${contentBody}\nendstream`;
  objs[5] = fontHelv;
  objs[6] = fontBold;

  let body = "";
  const offsets: number[] = [];
  for (let i = 1; i <= 6; i++) {
    offsets[i] = body.length;
    body += `${i} 0 obj\n${objs[i]}\nendobj\n`;
  }
  const finalPdf = "%PDF-1.4\n" + body;
  const xrefPos = finalPdf.length;
  const count = 7;
  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  return Buffer.from(finalPdf + xref + `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`, "latin1");
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

  // Build pages of content; simple single-page-per-~30 rows
  const perPage = 26;
  const pages: typeof rows[] = [];
  for (let i = 0; i < rows.length; i += perPage) {
    pages.push(rows.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push([]);

  // We'll assemble objects then build xref
  const objects: { body: string }[] = [{ body: "%PDF placeholder" }]; // 1-indexed

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

  // page object ids need to be known to parent; build them
  let running = 4; // catalog, pages, font, fontbold
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

  // Rebuild body with correct numbers
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

  // Headers
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