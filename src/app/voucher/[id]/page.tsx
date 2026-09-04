import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { voucherAmountLabel, getVoucherLayout, validUntilParts } from "@/lib/gift-voucher";
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
            <FieldValue value={voucherAmountLabel(amount)} x={layout.amount.x} y={layout.amount.y} className="text-right text-lg font-bold" />
            <FieldValue value={voucher.recipientName} x={layout.to.x} y={layout.to.y} className="text-lg" />
            {voucher.buyerName && (
              <FieldValue value={voucher.buyerName} x={layout.from.x} y={layout.from.y} className="text-lg" />
            )}
            <FieldValue value={voucher.voucherNo} x={layout.voucherNo.x} y={layout.voucherNo.y} className="font-mono text-sm font-bold" />
            <FieldValue value="" dateParts={validUntilParts(voucher.validUntil)} x={layout.validUntil.x} y={layout.validUntil.y} className="text-base" />
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
  dateParts,
  x,
  y,
  className,
  width,
  alignRight,
}: {
  value: string;
  dateParts?: { day: string; month: string; year: string };
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
      {dateParts ? (
        <p className={`flex items-center font-semibold text-primary-dark ${className ?? ""}`}>
          <span>{dateParts.day}</span>
          <span className="mx-[8px]">/</span>
          <span>{dateParts.month}</span>
          <span className="mx-[8px]">/</span>
          <span>{dateParts.year}</span>
        </p>
      ) : (
        <p className={`font-semibold text-primary-dark ${className ?? ""}`}>{value}</p>
      )}
    </div>
  );
}