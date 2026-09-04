"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, CalendarHeart, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { whatsappLink, contactWhatsAppMessage } from "@/lib/notifications";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Price List", href: "/price-list" },
  { label: "Book Appointment", href: "/book" },
  { label: "Gift Vouchers", href: "/gift-voucher" },
  { label: "Contact", href: "/contact" },
];

export function ClientHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/10 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Image
            src="/images/logo.png"
            alt="Bee-U by Bernie"
            width={44}
            height={44}
            className="rounded-full object-contain"
            priority
          />
          <span className="font-serif-display text-lg font-semibold tracking-wide text-foreground">
            Bee-U <span className="text-accent">by Bernie</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "text-accent"
                  : "text-foreground/70 hover:text-accent"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={whatsappLink(contactWhatsAppMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex h-10 items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-medium text-white hover:bg-[#1eb958]"
          >
            <span aria-hidden>💬</span>
            <span className="hidden sm:inline">WhatsApp</span>
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav
          className="border-t border-primary/10 bg-background px-4 pb-4 pt-2 md:hidden"
          aria-label="Mobile navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium",
                pathname === link.href
                  ? "text-accent"
                  : "text-foreground/70"
              )}
            >
              {link.label}
            </Link>
          ))}
          <a
            href={whatsappLink(contactWhatsAppMessage())}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 text-sm font-medium text-white"
          >
            <span aria-hidden>💬</span> WhatsApp Us
          </a>
        </nav>
      )}
    </header>
  );
}