import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/business";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditServiceForm } from "@/components/admin/service-edit";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { order: "asc" },
    include: { services: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-serif-display text-2xl font-semibold">Services</h1>
      <p className="text-sm text-foreground/60">
        Manage services, prices and categories.
      </p>

      <div className="mt-6 space-y-6">
        {categories.map((cat) => (
          <Card key={cat.id}>
            <CardHeader className="border-b border-primary/10">
              <CardTitle className="text-lg">{cat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-primary/10">
                {cat.services.map((s) => (
                  <li key={s.id} className="flex flex-col gap-2 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{s.name}</span>
                      {s.isPerNail && (
                        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent-dark">per nail</span>
                      )}
                      <span className="text-xs text-foreground/50">
                        {s.duration > 0 ? `~${s.duration} min` : "add-on"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary-dark">{formatPrice(s.price)}</span>
                      <EditServiceForm
                        serviceId={s.id}
                        name={s.name}
                        price={s.price}
                        duration={s.duration}
                        isPerNail={s.isPerNail}
                        isActive={s.isActive}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}

        <p className="text-sm text-foreground/50">
          To add a new service, edit the seed data in{" "}
          <code className="rounded bg-primary/10 px-1">prisma/seed.ts</code> and re-run{" "}
          <code className="rounded bg-primary/10 px-1">npm run db:seed</code>.
        </p>
      </div>
    </div>
  );
}