import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { voucherAmountLabel, formatValidUntil } from "@/lib/gift-voucher";
import { BUSINESS } from "@/lib/business";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const voucher = await prisma.giftVoucher.findUnique({
    where: { id },
    select: { voucherNo: true, amount: true, recipientName: true },
  });
  if (!voucher) return { title: "Voucher not found" };
  return {
    title: `Gift Voucher ${voucher.voucherNo} — ${voucherAmountLabel(Number(voucher.amount))} for ${voucher.recipientName} | Bee-U by Bernie`,
  };
}

export default async function VoucherViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const voucher = await prisma.giftVoucher.findUnique({ where: { id } });
  if (!voucher) notFound();

  const amount = Number(voucher.amount);
  const validUntilStr = formatValidUntil(voucher.validUntil);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Voucher card — template with transparent text overlay */}
        <div
          className="relative overflow-hidden rounded-3xl shadow-2xl"
          style={{ aspectRatio: "1536/1024" }}
        >
          <Image
            src="/images/voucher-template.png"
            alt="Gift Voucher"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-14">
            {/* Top-right: amount */}
            <div className="flex justify-end">
              <div className="rounded-lg bg-white/50 px-5 py-2 text-right shadow-sm backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark/60">Amount</p>
                <p className="text-2xl font-bold text-primary-dark/80">{voucherAmountLabel(amount)}</p>
              </div>
            </div>

            {/* Middle: To / From */}
            <div className="mx-auto w-full max-w-sm space-y-3">
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

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-foreground/40">
          <p>Present this voucher at {BUSINESS.name} to redeem.</p>
          <p className="mt-1">{BUSINESS.phone}</p>
        </div>
      </div>
    </div>
  );
}