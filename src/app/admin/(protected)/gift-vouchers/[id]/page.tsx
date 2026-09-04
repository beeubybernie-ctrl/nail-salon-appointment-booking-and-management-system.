import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { voucherAmountLabel, formatPurchaseDate, formatValidUntil } from "@/lib/gift-voucher";
import { whatsappLink } from "@/lib/notifications";
import { VoucherStatusButtons } from "@/components/admin/voucher-status-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, Download, MessageCircle } from "lucide-react";

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

  const waMessage = [
    `Hi! Here is your Bee-U by Bernie gift voucher`,
    ``,
    `Voucher No: ${voucher.voucherNo}`,
    `Value: ${voucherAmountLabel(amount)}`,
    `For: ${voucher.recipientName}`,
    `Valid until: ${validUntilStr}`,
    ``,
    `Present this voucher at the salon to redeem.`,
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
              {/* Transparent text overlay */}
              <div className="absolute inset-0 flex flex-col justify-between p-10 sm:p-16">
                {/* Top-right: amount */}
                <div className="flex justify-end">
                  <div className="rounded-lg bg-white/50 px-5 py-2 text-right shadow-sm backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/60">Amount</p>
                    <p className="text-3xl font-bold text-primary-dark/80">{voucherAmountLabel(amount)}</p>
                  </div>
                </div>

                {/* Middle: To / From */}
                <div className="mx-auto w-full max-w-lg space-y-3">
                  <div className="rounded-lg bg-white/50 px-5 py-3 shadow-sm backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/60">To</p>
                    <p className="text-lg font-semibold text-foreground/80">{voucher.recipientName}</p>
                  </div>
                  {voucher.buyerName && (
                    <div className="rounded-lg bg-white/50 px-5 py-3 shadow-sm backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/60">From</p>
                      <p className="text-lg font-semibold text-foreground/80">{voucher.buyerName}</p>
                    </div>
                  )}
                </div>

                {/* Bottom row: voucher no left, valid until right */}
                <div className="flex items-end justify-between">
                  <div className="rounded-lg bg-white/50 px-4 py-2 shadow-sm backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/60">Voucher No</p>
                    <p className="font-mono text-sm font-bold text-foreground/80">{voucher.voucherNo}</p>
                  </div>
                  <div className="rounded-lg bg-white/50 px-4 py-2 text-right shadow-sm backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/60">Valid Until</p>
                    <p className="text-sm font-semibold text-foreground/80">{validUntilStr}</p>
                  </div>
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
            <a
              href={`/api/admin/gift-vouchers/${voucher.id}/download`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10"
            >
              <Download className="h-3.5 w-3.5" /> Download PDF
            </a>
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