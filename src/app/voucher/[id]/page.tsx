import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { voucherAmountLabel, formatPurchaseDate, formatValidUntil } from "@/lib/gift-voucher";
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
    openGraph: {
      title: `Gift Voucher ${voucherAmountLabel(Number(voucher.amount))}`,
      description: `A Bee-U by Bernie gift voucher for ${voucher.recipientName}`,
    },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Voucher card */}
        <div
          className="relative overflow-hidden rounded-3xl shadow-2xl"
          style={{ aspectRatio: "1536/1024" }}
        >
          <Image
            src="/images/voucher-template.png"
            alt="Voucher"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-between p-6 text-center sm:p-10">
            {/* Top: logo + brand */}
            <div className="flex flex-col items-center">
              <Image
                src="/images/bee-u-logo.png"
                alt="Bee-U by Bernie"
                width={72}
                height={72}
                className="rounded-full object-contain shadow-lg"
              />
              <h1 className="mt-3 font-serif-display text-xl font-semibold text-white drop-shadow-lg">
                {BUSINESS.name}
              </h1>
              <p className="text-sm text-white/80 drop-shadow-md">{BUSINESS.tagline}</p>
            </div>

            {/* Middle: voucher content */}
            <div className="w-full max-w-md rounded-2xl bg-white/90 px-8 py-6 shadow-xl backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-dark">
                Gift Voucher
              </p>
              <p className="mt-3 text-5xl font-bold text-primary-dark">
                {voucherAmountLabel(amount)}
              </p>
              <p className="mt-4 text-sm text-foreground/50">For</p>
              <p className="text-2xl font-semibold text-foreground">
                {voucher.recipientName}
              </p>
            </div>

            {/* Bottom: details */}
            <div className="flex flex-col items-center gap-1 text-xs text-white/80 drop-shadow-md">
              <p className="rounded-full bg-white/20 px-4 py-1 font-mono text-sm font-bold text-white drop-shadow-md">
                {voucher.voucherNo}
              </p>
              <p>Purchased: {formatPurchaseDate(voucher.purchasedAt)}</p>
              <p>Valid until: {formatValidUntil(voucher.validUntil)}</p>
              {voucher.message && (
                <p className="mt-2 max-w-sm rounded-xl bg-white/15 px-4 py-2 italic text-white/70">
                  &ldquo;{voucher.message}&rdquo;
                </p>
              )}
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