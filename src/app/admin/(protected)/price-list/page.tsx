import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PriceListAdminPage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: { services: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif-display text-2xl font-semibold">Price List</h1>
          <p className="text-sm text-foreground/60">
            Prices as shown to clients. Edit prices under Services.
          </p>
        </div>
        <Link href="/admin/services">
          <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5">
            <Pencil className="h-4 w-4" /> Edit Prices
          </span>
        </Link>
      </div>

      <div className="space-y-6">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-lg">{cat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-primary/10">
                {cat.services.map((s) => (
                  <li key={s.id} className="flex items-baseline justify-between gap-4 py-3">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-sm font-semibold text-primary-dark">
                      {s.isPerNail ? `${formatPrice(s.price)} / nail` : formatPrice(s.price)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}