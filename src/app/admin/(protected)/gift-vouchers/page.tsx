import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { voucherAmountLabel, formatPurchaseDate, formatValidUntil } from "@/lib/gift-voucher";
import { VoucherStatusButtons } from "@/components/admin/voucher-status-buttons";
import { VoucherExportButtons } from "@/components/admin/voucher-export-buttons";
import { DeleteVoucherButton, ClearAllVouchersButton } from "@/components/admin/voucher-delete-buttons";
import Link from "next/link";
import { Gift, MessageCircle, LayoutGrid } from "lucide-react";
import { whatsappLink } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  REQUESTED: "Requested",
  PAID: "Paid",
  SENT: "Sent",
  REDEEMED: "Redeemed",
  CANCELLED: "Cancelled",
};

function VoucherStatusBadge({ status }: { status: string }) {
  const map: Record<string, "pending" | "confirmed" | "default" | "completed" | "cancelled"> = {
    REQUESTED: "pending",
    PAID: "confirmed",
    SENT: "default",
    REDEEMED: "completed",
    CANCELLED: "cancelled",
  };
  return <Badge variant={map[status] ?? "default"}>{LABELS[status] ?? status}</Badge>;
}

export default async function GiftVouchersPage() {
  const vouchers = await prisma.giftVoucher.findMany({
    orderBy: { createdAt: "desc" },
  });

  const requested = vouchers.filter((v) => v.status === "REQUESTED").length;
  const paid = vouchers.filter((v) => v.status === "PAID").length;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold sm:text-3xl">
            Gift Vouchers
          </h1>
          <p className="text-sm text-foreground/60">
            Track requests, mark as paid, then download and WhatsApp the voucher.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/gift-vouchers/layout"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10"
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Layout
          </Link>
          <VoucherExportButtons />
          <ClearAllVouchersButton />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold">{vouchers.length}</p>
            <p className="text-xs text-foreground/60">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold">{requested}</p>
            <p className="text-xs text-foreground/60">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xl font-bold">{paid}</p>
            <p className="text-xs text-foreground/60">Paid (to send)</p>
          </CardContent>
        </Card>
      </div>

      {vouchers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Gift className="h-10 w-10 text-primary/40" />
            <p className="font-medium">No gift vouchers yet</p>
            <p className="text-sm text-foreground/60">
              New requests from the &ldquo;Gift Vouchers&rdquo; page will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {vouchers.map((v) => {
            const waMessage = `Hi! Your Bee-U by Bernie gift voucher (${v.voucherNo}) for ${voucherAmountLabel(Number(v.amount))} is ready. Present it at the salon to redeem. Valid until ${formatValidUntil(v.validUntil)}.`;
            return (
              <Card key={v.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{v.voucherNo}</span>
                    <VoucherStatusBadge status={v.status} />
                  </div>
                  <div className="mt-2 space-y-1 text-sm text-foreground/70">
                    <p>
                      <span className="text-foreground/50">For:</span> {v.recipientName}
                      {v.recipientPhone ? ` (${v.recipientPhone})` : ""}
                    </p>
                    <p>
                      <span className="text-foreground/50">Value:</span>{" "}
                      <span className="font-semibold text-primary-dark">
                        {voucherAmountLabel(Number(v.amount))}
                      </span>
                    </p>
                    <p>
                      <span className="text-foreground/50">Purchased:</span>{" "}
                      {formatPurchaseDate(v.purchasedAt)}
                    </p>
                    <p>
                      <span className="text-foreground/50">Valid until:</span>{" "}
                      {formatValidUntil(v.validUntil)}
                    </p>
                    {v.message && (
                      <p>
                        <span className="text-foreground/50">Message:</span> {v.message}
                      </p>
                    )}
                    {v.buyerName && (
                      <p className="text-xs text-foreground/50">
                        Buyer: {v.buyerName} ({v.buyerEmail || v.buyerPhone})
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <VoucherStatusButtons
                      voucherId={v.id}
                      currentStatus={v.status}
                    />
                    <a
                      href={whatsappLink(waMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-medium text-white hover:bg-[#1eb958]"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Voucher
                    </a>
                    <Link
                      href={`/admin/gift-vouchers/${v.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 px-3 py-2 text-xs font-medium text-primary-dark transition hover:bg-primary/10"
                    >
                      View
                    </Link>
                    <DeleteVoucherButton voucherId={v.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}