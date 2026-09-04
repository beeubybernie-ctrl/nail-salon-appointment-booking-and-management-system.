import type { Metadata } from "next";
import { GiftVoucherForm } from "@/components/client/gift-voucher-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Gift Vouchers | Bee-U by Bernie",
  description:
    "Buy a Bee-U by Bernie gift voucher for someone special. Valid for 3 months.",
};

export default function GiftVoucherPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif-display text-3xl font-semibold sm:text-4xl">
          Gift Vouchers
        </h1>
        <p className="mt-3 text-foreground/60">
          The perfect present — a treatment at Bee-U by Bernie. Valid for 3
          months from purchase.
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="p-6">
          <GiftVoucherForm />
        </CardContent>
      </Card>

      <div className="mt-6 rounded-xl bg-primary/5 p-4 text-xs text-foreground/60">
        <p className="font-medium text-sm">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Fill in who the voucher is for and the value.</li>
          <li>We send you the payment details (EFT / WhatsApp) to pay.</li>
          <li>
            Once payment reflects, we send your voucher via WhatsApp to redeem
            at the salon.
          </li>
        </ol>
      </div>
    </div>
  );
}