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
        {/* Voucher card — template with light text overlay */}
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
            {/* Top row: logo left, amount right */}
            <div className="flex items-start justify-between">
              <Image
                src="/images/bee-u-logo.png"
                alt="Bee-U by Bernie"
                width={56}
                height={56}
                className="rounded-full object-contain shadow-md"
              />
              <div className="rounded-xl bg-white/80 px-5 py-2 text-right shadow-md backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Amount</p>
                <p className="text-2xl font-bold text-primary-dark">{voucherAmountLabel(amount)}</p>
              </div>
            </div>

            {/* Middle: To / From */}
            <div className="mx-auto w-full max-w-sm space-y-3">
              <div className="rounded-xl bg-white/80 px-5 py-3 shadow-md backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">To</p>
                <p className="text-lg font-semibold text-foreground">{voucher.recipientName}</p>
              </div>
              {voucher.buyerName && (
                <div className="rounded-xl bg-white/80 px-5 py-3 shadow-md backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">From</p>
                  <p className="text-lg font-semibold text-foreground">{voucher.buyerName}</p>
                </div>
              )}
              {voucher.message && (
                <div className="rounded-xl bg-white/80 px-5 py-3 shadow-md backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Message</p>
                  <p className="text-sm italic text-foreground/80">&ldquo;{voucher.message}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Bottom row: voucher no left, valid until right */}
            <div className="flex items-end justify-between">
              <div className="rounded-xl bg-white/80 px-4 py-2 shadow-md backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Voucher No</p>
                <p className="font-mono text-sm font-bold text-foreground">{voucher.voucherNo}</p>
              </div>
              <div className="rounded-xl bg-white/80 px-4 py-2 text-right shadow-md backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Valid Until</p>
                <p className="text-sm font-semibold text-foreground">{validUntilStr}</p>
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