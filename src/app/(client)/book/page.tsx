import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/client/booking/booking-wizard";
import { AvailabilityMiniCalendar } from "@/components/client/booking/availability-mini-calendar";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Book Appointment | Bee-U by Bernie",
  description:
    "Book your nail appointment at Bee-U by Bernie. Be You. Be Beautiful.",
};

export default function BookPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <div className="mx-auto my-8 max-w-2xl">
        <AvailabilityMiniCalendar />
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-foreground/50">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading booking...
          </div>
        }
      >
        <BookingWizard />
      </Suspense>
    </div>
  );
}