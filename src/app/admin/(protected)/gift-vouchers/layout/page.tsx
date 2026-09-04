import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { VoucherLayoutEditor } from "@/components/admin/voucher-layout-editor";
import { ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

const LAYOUT_KEY = "voucherLayout";

export default async function VoucherLayoutPage() {
  const user = await requireAdmin();
  if (!user) notFound();

  const setting = await prisma.setting.findUnique({ where: { key: LAYOUT_KEY } });
  const layout = setting ? JSON.parse(setting.value) : undefined;

  return (
    <div className="p-4 sm:p-6">
      <Link
        href="/admin/gift-vouchers"
        className="inline-flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Gift Vouchers
      </Link>

      <div className="mt-4">
        <h1 className="font-serif-display text-2xl font-semibold sm:text-3xl">
          Voucher Layout
        </h1>
        <p className="mt-1 text-sm text-foreground/60">
          Drag each field to match where it appears on your voucher template.
          Click Save when done.
        </p>
      </div>

      <div className="mt-6">
        <VoucherLayoutEditor initialLayout={layout} />
      </div>
    </div>
  );
}