import { getServiceCatalog } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatPrice } from "@/lib/business";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Bee-U by Bernie",
  description:
    "Explore Bee-U by Bernie nail services – manicures, acrylics, gel X, overlays and extras. Be You. Be Beautiful.",
};

export default async function ServicesPage() {
  const catalog = await getServiceCatalog();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif-display text-3xl font-semibold sm:text-4xl">
          Our Services
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-foreground/60">
          Choose a service to begin your booking. You can add extras like chrome,
          French tips and nail art to any appointment.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {catalog.map((cat) => (
          <Card key={cat.categoryName}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="font-serif-display text-xl">
                  {cat.categoryName}
                </span>
                {cat.categoryName === "EXTRAS" && (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary-dark">
                    Add-ons
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-primary/10">
                {cat.services.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <span className="text-sm font-medium">{s.name}</span>
                      {s.isPerNail && (
                        <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent-dark">
                          per nail
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-primary-dark">
                      {formatPrice(s.price)}
                      {s.isPerNail && " / nail"}
                    </span>
                  </li>
                ))}
              </ul>
              {cat.categoryName !== "EXTRAS" && (
                <div className="mt-4">
                  <Link href={`/book?service=${encodeURIComponent(cat.services[0]?.name ?? "")}`}>
                    <Button size="sm" variant="outline" className="w-full">
                      Book {cat.categoryName.charAt(0) + cat.categoryName.slice(1).toLowerCase()}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}