import Link from "next/link";
import Image from "next/image";
import { whatsappLink, contactWhatsAppMessage } from "@/lib/notifications";
import { BUSINESS } from "@/lib/business";

export function Footer() {
  return (
    <footer className="border-t border-primary/10 bg-primary/5">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/images/logo.png"
                alt="Bee-U by Bernie"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="font-serif-display text-base font-semibold">
                Bee-U <span className="text-accent">by Bernie</span>
              </span>
            </div>
            <p className="mt-2 text-sm text-foreground/60">
              {BUSINESS.tagline}. Professional nail care in a warm, elegant
              studio.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Contact
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li>
                <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>
                  {BUSINESS.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </li>
              <li>
                <a
                  href={whatsappLink(contactWhatsAppMessage())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25a85c]"
                >
                  WhatsApp Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Quick Links
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/services" className="hover:text-accent">
                  Services
                </Link>
              </li>
              <li>
                <Link href="/price-list" className="hover:text-accent">
                  Price List
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-accent">
                  Book Appointment
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary/10 pt-6 text-center text-xs text-foreground/50">
          © {new Date().getFullYear()} Bee-U by Bernie · Be You. Be Beautiful.
        </div>
      </div>
    </footer>
  );
}