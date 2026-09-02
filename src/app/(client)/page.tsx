import Link from "next/link";
import Image from "next/image";
import { CalendarHeart, Sparkles, Clock, Phone, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessHoursBlock } from "@/components/client/business-hours";
import { AvailabilityMiniCalendar } from "@/components/client/booking/availability-mini-calendar";
import { whatsappLink, contactWhatsAppMessage } from "@/lib/notifications";
import { BUSINESS } from "@/lib/business";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <div className="mx-auto mb-6 flex justify-center">
            <Image
              src="/images/logo.png"
              alt="Bee-U by Bernie"
              width={120}
              height={120}
              className="rounded-full object-contain shadow-lg"
              priority
            />
          </div>
          <h1 className="font-serif-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Bee-U <span className="text-accent">by Bernie</span>
          </h1>
          <p className="mt-3 text-lg font-light tracking-wide text-foreground/60">
            {BUSINESS.tagline}
          </p>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-foreground/70">
            Welcome to a boutique nail studio where every appointment is a little
            moment of care. Book your nails online in under a minute.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/book">
              <Button size="lg" className="w-full sm:w-auto">
                <CalendarHeart className="mr-2 h-5 w-5" />
                Book Your Appointment
              </Button>
            </Link>
            <a
              href={whatsappLink(contactWhatsAppMessage())}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="whatsapp"
                size="lg"
                className="w-full sm:w-auto"
              >
                <span aria-hidden>💬</span>
                Chat on WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="text-sm font-semibold">Premium Service</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  Tailored nail care with a personal, boutique touch.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="text-sm font-semibold">Easy Online Booking</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  Pick a service, a date and a time — no account needed.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-3 p-5">
              <Heart className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="text-sm font-semibold">You First</h3>
                <p className="mt-1 text-sm text-foreground/60">
                  Be You. Be Beautiful. — your nails, your style.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="text-center">
          <h2 className="font-serif-display text-2xl font-semibold sm:text-3xl">
            Our Services
          </h2>
          <p className="mt-2 text-foreground/60">
            From classic manicures to full acrylic and gel nail sets.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Plain Manicure", price: "R150", desc: "Classic care and polish" },
            { name: "Acrylic", price: "R180", desc: "Short, medium or long" },
            { name: "Gel X", price: "R150", desc: "Lightweight soft gel extensions" },
            { name: "Overlays", price: "R110", desc: "Rubber base & gel overlay" },
            { name: "Extras", price: "From R20", desc: "Chrome, French tips, art & more" },
            { name: "Soak Off", price: "R50", desc: "Gentle removal" },
          ].map((s) => (
            <Card key={s.name}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{s.name}</h3>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary-dark">
                    {s.price}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground/60">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/price-list">
            <Button variant="outline">View Full Price List</Button>
          </Link>
        </div>
      </section>

      {/* Business hours */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <BusinessHoursBlock />
      </section>

      {/* Availability mini-calendar */}
      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <AvailabilityMiniCalendar />
        </div>
      </section>

      {/* Contact bar */}
      <section className="border-t border-primary/10 bg-primary/5">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="font-serif-display text-2xl font-semibold">
              Ready for beautiful nails?
            </h2>
            <p className="text-foreground/70">
              Book online, or reach us on WhatsApp or email.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/book">
                <Button>
                  <CalendarHeart className="mr-2 h-4 w-4" />
                  Book Now
                </Button>
              </Link>
              <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>
                <Button variant="secondary">
                  <Phone className="mr-2 h-4 w-4" />
                  {BUSINESS.phone}
                </Button>
              </a>
              <a href={`mailto:${BUSINESS.email}`}>
                <Button variant="outline">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Us
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

