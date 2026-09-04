import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { voucherAmountLabel, formatValidUntil, getVoucherLayout } from "@/lib/gift-voucher";
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
  const layout = await getVoucherLayout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
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
          {/* Values only — labels are on the template */}
          <div className="absolute inset-0">
            <FieldValue value={voucherAmountLabel(amount)} x={layout.amount.x} y={layout.amount.y} className="text-right text-2xl font-bold text-primary-dark/80" />
            <FieldValue value={voucher.recipientName} x={layout.to.x} y={layout.to.y} />
            {voucher.buyerName && (
              <FieldValue value={voucher.buyerName} x={layout.from.x} y={layout.from.y} />
            )}
            <FieldValue value={voucher.voucherNo} x={layout.voucherNo.x} y={layout.voucherNo.y} className="font-mono text-sm font-bold" />
            <FieldValue value={validUntilStr} x={layout.validUntil.x} y={layout.validUntil.y} width="25%" alignRight className="text-lg" />
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-foreground/40">
          <p>Present this voucher at {BUSINESS.name} to redeem.</p>
          <p className="mt-1">{BUSINESS.phone}</p>
        </div>
      </div>
    </div>
  );
}

function FieldValue({
  value,
  x,
  y,
  className,
  width,
  alignRight,
}: {
  value: string;
  x: number;
  y: number;
  className?: string;
  width?: string;
  alignRight?: boolean;
}) {
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
      <p className={`text-sm font-semibold text-foreground/80 ${className ?? ""}`}>{value}</p>
    </div>
  );
}