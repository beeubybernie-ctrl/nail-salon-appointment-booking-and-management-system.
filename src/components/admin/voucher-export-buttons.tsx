"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

function download(format: string) {
  window.location.href =
    `/api/admin/gift-vouchers/export?format=${encodeURIComponent(format)}`;
}

export function VoucherExportButtons() {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => download("csv")}
      >
        <Download className="h-4 w-4" /> CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => download("pdf")}
      >
        <Download className="h-4 w-4" /> PDF
      </Button>
    </div>
  );
}