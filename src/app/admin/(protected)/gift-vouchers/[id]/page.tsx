import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { voucherAmountLabel, formatPurchaseDate, formatValidUntil } from "@/lib/gift-voucher";
import { whatsappLink } from "@/lib/notifications";
import { VoucherStatusButtons } from "@/components/admin/voucher-status-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, MessageCircle, Share2 } from "lucide-react";

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
  const waMessage = [
    `Hi! Here is your Bee-U by Bernie gift voucher 🎁`,
    ``,
    `Voucher No: ${voucher.voucherNo}`,
    `Value: ${voucherAmountLabel(amount)}`,
    `For: ${voucher.recipientName}`,
    `Valid until: ${formatValidUntil(voucher.validUntil)}`,
    ``,
    `Present this voucher at the salon to redeem.`,
    voucher.message ? `\nMessage: ${voucher.message}` : "",
    ``,
    `Be You. Be Beautiful.`,
  ]
    .filter(Boolean)
    .join("\n");

  const publicUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/+$/, "")}/voucher/${voucher.id}`;

  return (
    <div className="p-4 sm:p-6">
      <Link
        href="/admin/gift-vouchers"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> All gift vouchers
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Voucher visual */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: "1536/1024" }}>
              <Image
                src="/images/voucher-template.png"
                alt="Voucher template"
                fill
                className="object-cover"
                priority
              />
              {/* Overlay with voucher details */}
              <div className="absolute inset-0 flex flex-col items-center justify-between p-8 text-center">
                {/* Top section: logo */}
                <div className="flex flex-col items-center">
                  <Image
                    src="/images/bee-u-logo.png"
                    alt="Bee-U by Bernie"
                    width={80}
                    height={80}
                    className="rounded-full object-contain"
                  />
                  <p className="mt-2 font-serif-display text-lg font-semibold text-white drop-shadow-md">
                    Bee-U by Bernie
                  </p>
                  <p className="text-xs text-white/80 drop-shadow-md">Be You. Be Beautiful.</p>
                </div>

                {/* Middle section: voucher content */}
                <div className="rounded-2xl bg-white/90 px-10 py-6 shadow-lg backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary-dark">
                    Gift Voucher
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary-dark sm:text-5xl">
                    {voucherAmountLabel(amount)}
                  </p>
                  <p className="mt-3 text-sm text-foreground/60">For</p>
                  <p className="text-xl font-semibold text-foreground">
                    {voucher.recipientName}
                  </p>
                </div>

                {/* Bottom section: details */}
                <div className="flex flex-col items-center gap-1 text-xs text-white/80 drop-shadow-md">
                  <p className="font-mono text-sm font-semibold text-white drop-shadow-md">
                    {voucher.voucherNo}
                  </p>
                  <p>Purchased: {formatPurchaseDate(voucher.purchasedAt)}</p>
                  <p>Valid until: {formatValidUntil(voucher.validUntil)}</p>
                  {voucher.message && (
                    <p className="mt-1 max-w-sm italic text-white/70">
                      &ldquo;{voucher.message}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <VoucherStatusButtons
              voucherId={voucher.id}
              currentStatus={voucher.status}
            />
            <Link
              href={`/api/admin/gift-vouchers/${voucher.id}/download`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Link>
            <a
              href={whatsappLink(waMessage)}
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
                <DetailRow label="Recipient Phone" value={voucher.recipientPhone} />
              )}
              <DetailRow label="Status" value={voucher.status} />
              <DetailRow label="Purchased" value={formatPurchaseDate(voucher.purchasedAt)} />
              <DetailRow label="Valid Until" value={formatValidUntil(voucher.validUntil)} />
              {voucher.message && (
                <DetailRow label="Message" value={voucher.message} />
              )}
            </CardContent>
          </Card>

          {voucher.buyerName && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Buyer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <DetailRow label="Name" value={voucher.buyerName} />
                {voucher.buyerPhone && (
                  <DetailRow label="Phone" value={voucher.buyerPhone} />
                )}
                {voucher.buyerEmail && (
                  <DetailRow label="Email" value={voucher.buyerEmail} />
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Share Voucher</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-foreground/60">
              <p className="mb-3">
                Share this link with the client so they can view and save their voucher:
              </p>
              <code className="block break-all rounded-lg bg-muted/50 p-3 text-xs text-foreground/70">
                {publicUrl}
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
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
      <span
        className={`text-right ${mono ? "font-mono text-xs" : ""} ${bold ? "font-semibold text-primary-dark" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}