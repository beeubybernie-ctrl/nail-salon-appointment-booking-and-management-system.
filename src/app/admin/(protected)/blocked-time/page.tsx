import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BlockedTimeForm } from "@/components/admin/blocked-time-form";
import { BlockedTimeItem } from "@/components/admin/blocked-time-item";
import { formatDate } from "@/lib/business";

export const dynamic = "force-dynamic";

export default async function BlockedTimePage() {
  const now = new Date();
  const blocks = await prisma.blockedTime.findMany({
    orderBy: { date: "desc" },
  });

const upcoming = blocks
    .filter((b) => new Date(`${formatDate(b.date)}T${b.endTime}`) >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const past = blocks
    .filter((b) => new Date(`${formatDate(b.date)}T${b.endTime}`) < now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  function formatDateLong(d: Date) {
    return new Date(d).toLocaleDateString("en-ZA", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-serif-display text-2xl font-semibold">Blocked Time</h1>
      <p className="text-sm text-foreground/60">
        Block times for breaks, holidays, personal commitments or maintenance.
        These disappear from client availability.
      </p>

      <div className="mt-6">
        <BlockedTimeForm />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-sm text-foreground/60">No upcoming blocked times.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <BlockedTimeItem key={b.id} id={b.id} title={b.title} dateLabel={formatDateLong(b.date)} start={b.startTime} end={b.endTime} notes={b.notes} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Past</h2>
          <div className="space-y-2 opacity-70">
            {past.map((b) => (
              <BlockedTimeItem key={b.id} id={b.id} title={b.title} dateLabel={formatDateLong(b.date)} start={b.startTime} end={b.endTime} notes={b.notes} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
