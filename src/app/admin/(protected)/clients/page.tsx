import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/business";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClientSearch } from "@/components/admin/client-search";

export const dynamic = "force-dynamic";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const clients = await prisma.client.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { phone: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : {},
    include: { appointments: true },
    orderBy: { name: "asc" },
  });

  const totals = clients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    appointmentCount: c.appointments.length,
    totalSpend: c.appointments
      .filter((a) => a.status !== "CANCELLED")
      .reduce((s, a) => s + a.price, 0),
  }));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="font-serif-display text-2xl font-semibold">Clients</h1>
        <p className="text-sm text-foreground/60">{clients.length} clients</p>
      </div>

      <ClientSearch initialQuery={query} />

      {totals.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <Users className="h-10 w-10 text-primary/40" />
            <p className="font-medium">No clients found</p>
            <p className="text-sm text-foreground/60">
              {query ? "Try a different search term." : "Clients will appear here after their first booking."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {totals.map((c) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`}>
              <Card className="hover:border-primary/40">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="mt-1 text-sm text-foreground/60">{c.phone}</p>
                  <p className="truncate text-sm text-foreground/60">{c.email}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-foreground/50">
                      {c.appointmentCount} appointment{c.appointmentCount === 1 ? "" : "s"}
                    </span>
                    <span className="font-semibold text-primary-dark">
                      {formatPrice(c.totalSpend)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}