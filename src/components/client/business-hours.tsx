import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export async function BusinessHoursBlock() {
  const hours = await prisma.businessHours.findMany({ orderBy: { dayOfWeek: "asc" } });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-accent" />
          Business Hours
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1 sm:grid-cols-2">
          {DAYS.map((day, i) => {
            const h = hours.find((x) => x.dayOfWeek === i);
            return (
              <div
                key={i}
                className="flex items-center justify-between border-b border-primary/10 py-2 last:border-0"
              >
                <span className="text-sm font-medium text-foreground/80">
                  {day}
                </span>
                <span className="text-sm text-foreground/60">
                  {h && h.isActive
                    ? `${h.openTime} – ${h.closeTime}`
                    : "Closed"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];