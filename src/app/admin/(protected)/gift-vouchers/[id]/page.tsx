import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { voucherAmountLabel, formatPurchaseDate, formatValidUntil, getVoucherLayout, validUntilParts } from "@/lib/gift-voucher";
import { whatsappLink, toWhatsAppNumber } from "@/lib/notifications";
import { VoucherStatusButtons } from "@/components/admin/voucher-status-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Download, ImageIcon, MessageCircle } from "lucide-react";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://bee-u-app.vercel.app").trim().replace(/\/+$/, "");

export const dynamic = "force-dynamic";

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  if (!user) notFound();

  const { id } = await params;
  const voucher = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!voucher) notFound();

  const amount = Number(voucher.amount);
  const validUntilStr = formatValidUntil(voucher.validUntil);
  const layout = await getVoucherLayout();

  const waMessage = [
    `Hi! Here is your Bee-U by Bernie gift voucher`,
    ``,
    `Voucher No: ${voucher.voucherNo}`,
    `Value: ${voucherAmountLabel(amount)}`,
    `For: ${voucher.recipientName}`,
    `Valid until: ${validUntilStr}`,
    ``,
    `Present this voucher at the salon to redeem.`,
    ``,
    `View / download your voucher: ${APP_URL}/voucher/${voucher.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="p-4 sm:p-6">
      <Link
        href="/admin/gift-vouchers"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All gift vouchers
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Voucher visual — template with transparent text overlay */}
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="relative w-full" style={{ aspectRatio: "1536/1024" }}>
              <Image
                src="/images/voucher-template.png"
                alt="Voucher"
                fill
                className="object-cover"
                priority
              />
              {/* Transparent text overlay — positions from layout editor */}
              <div className="absolute inset-0">
                <FieldOverlay
                  value={voucherAmountLabel(amount)}
                  x={layout.amount.x}
                  y={layout.amount.y}
                  size={layout.amount.size}
                  font={layout.amount.font}
                  alignRight
                />
                <FieldOverlay
                  value={voucher.recipientName}
                  x={layout.to.x}
                  y={layout.to.y}
                  size={layout.to.size}
                  font={layout.to.font}
                />
                {voucher.buyerName && (
                  <FieldOverlay
                    value={voucher.buyerName}
                    x={layout.from.x}
                    y={layout.from.y}
                    size={layout.from.size}
                    font={layout.from.font}
                  />
                )}
                <FieldOverlay
                  value={`${voucher.voucherNo}`}
                  x={layout.voucherNo.x}
                  y={layout.voucherNo.y}
                  size={layout.voucherNo.size}
                  font={layout.voucherNo.font}
                />
                <FieldOverlay
                  value=""
                  dateParts={validUntilParts(voucher.validUntil)}
                  x={layout.validUntil.x}
                  y={layout.validUntil.y}
                  size={layout.validUntil.size}
                  font={layout.validUntil.font}
                />
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <VoucherStatusButtons
              voucherId={voucher.id}
              currentStatus={voucher.status}
            />
            <a
              href={`/api/admin/gift-vouchers/${voucher.id}/download`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </a>
            <a
              href={`/api/admin/gift-vouchers/${voucher.id}/image`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10"
            >
              <ImageIcon className="h-3.5 w-3.5" /> Download PNG
            </a>
            <a
              href={whatsappLink(waMessage, voucher.recipientPhone ? toWhatsAppNumber(voucher.recipientPhone) : undefined)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:bg-[#1eb958]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Voucher
            </a>
          </div>
        </div>

        {/* Details sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Voucher Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Voucher No" value={voucher.voucherNo} mono />
              <DetailRow label="Value" value={voucherAmountLabel(amount)} bold />
              <DetailRow label="Recipient" value={voucher.recipientName} />
              {voucher.recipientPhone && (
                <DetailRow label="Phone" value={voucher.recipientPhone} />
              )}
              <DetailRow label="Status" value={voucher.status} />
              <DetailRow label="Purchased" value={formatPurchaseDate(voucher.purchasedAt)} />
              <DetailRow label="Valid Until" value={validUntilStr} />
            </CardContent>
          </Card>

          {voucher.buyerName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Buyer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Name" value={voucher.buyerName} />
                {voucher.buyerPhone && <DetailRow label="Phone" value={voucher.buyerPhone} />}
                {voucher.buyerEmail && <DetailRow label="Email" value={voucher.buyerEmail} />}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldOverlay({
  value,
  dateParts,
  x,
  y,
  size,
  font,
  width,
  alignRight,
}: {
  value: string;
  dateParts?: { day: string; month: string; year: string };
  x: number;
  y: number;
  size: number;
  font: string;
  width?: string;
  alignRight?: boolean;
}) {
  const textStyle: CSSProperties = {
    fontSize: `${size}px`,
    fontFamily: font === "mono" ? "ui-monospace, monospace" : "inherit",
  };
  return (
    <div
      className="absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: width ?? "auto",
        textAlign: alignRight ? "right" : "left",
      }}
    >
      {dateParts ? (
        <p className="flex items-center text-primary-dark" style={textStyle}>
          <span>{dateParts.day}</span>
          <span className="mx-[8px]">/</span>
          <span>{dateParts.month}</span>
          <span className="mx-[8px]">/</span>
          <span>{dateParts.year}</span>
        </p>
      ) : (
        <p className="text-primary-dark" style={textStyle}>{value}</p>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-foreground/50">{label}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""} ${bold ? "font-semibold text-primary-dark" : ""}`}>
        {value}
      </span>
    </div>
  );
}