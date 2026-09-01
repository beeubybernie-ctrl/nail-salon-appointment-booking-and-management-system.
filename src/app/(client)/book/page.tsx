import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/client/booking/booking-wizard";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Book Appointment | Bee-U by Bernie",
  description:
    "Book your nail appointment at Bee-U by Bernie. Be You. Be Beautiful.",
};

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-foreground/50">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading booking...
        </div>
      }
    >
      <BookingWizard />
    </Suspense>
  );
}