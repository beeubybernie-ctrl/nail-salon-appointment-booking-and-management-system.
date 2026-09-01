import type { Metadata } from "next";
import Link from "next/link";
import { getServiceCatalog } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/business";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Price List | Bee-U by Bernie",
  description:
    "See the full Bee-U by Bernie price list – manicures, acrylics, gel X, overlays and extras.",
};

export default async function PriceListPage() {
  const catalog = await getServiceCatalog();
  const extrasCat = catalog.find((c) => c.categoryName === "EXTRAS");
  const mainCats = catalog.filter((c) => c.categoryName !== "EXTRAS");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif-display text-3xl font-semibold sm:text-4xl">
          Price List
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-foreground/60">
          All prices in South African Rand. Extras can be added to any service.
        </p>
      </div>

      {mainCats.map((cat) => (
        <Card key={cat.categoryName} className="mt-8">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="font-serif-display text-xl">
              {cat.categoryName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-primary/10">
              {cat.services.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-sm font-semibold text-primary-dark">
                    {formatPrice(s.price)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {extrasCat && (
        <Card className="mt-8">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="font-serif-display text-xl">Extras</CardTitle>
            <p className="text-sm text-foreground/60">
              Add any of these to your appointment.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-primary/10">
              {extrasCat.services.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="text-sm font-semibold text-primary-dark">
                    {s.isPerNail
                      ? `${formatPrice(s.price)} per nail`
                      : formatPrice(s.price)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="mt-10 flex justify-center">
        <Link href="/book">
          <Button size="lg">
            Book Now
          </Button>
        </Link>
      </div>
    </div>
  );
}