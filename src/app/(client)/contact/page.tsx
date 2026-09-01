import type { Metadata } from "next";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { whatsappLink, contactWhatsAppMessage } from "@/lib/notifications";
import { BUSINESS } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact | Bee-U by Bernie",
  description: "Get in touch with Bee-U by Bernie on WhatsApp, phone or email.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="font-serif-display text-3xl font-semibold sm:text-4xl">
          Contact
        </h1>
        <p className="mt-3 text-foreground/60">
          We&apos;d love to hear from you. Reach out on your favourite channel.
        </p>
      </div>

      <div className="mt-10 space-y-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <MessageCircle className="h-6 w-6 shrink-0 text-[#25a85c]" />
            <div className="flex-1">
              <h2 className="font-medium">WhatsApp</h2>
              <p className="text-sm text-foreground/60">
                Fastest response. Questions, bookings or help.
              </p>
            </div>
            <a
              href={whatsappLink(contactWhatsAppMessage())}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="whatsapp" size="sm">
                Chat
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Phone className="h-6 w-6 shrink-0 text-accent" />
            <div className="flex-1">
              <h2 className="font-medium">Phone</h2>
              <p className="text-sm text-foreground/60">{BUSINESS.phone}</p>
            </div>
            <a href={`tel:${BUSINESS.phone.replace(/\s/g, "")}`}>
              <Button variant="secondary" size="sm">
                Call
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <Mail className="h-6 w-6 shrink-0 text-accent" />
            <div className="flex-1">
              <h2 className="font-medium">Email</h2>
              <p className="text-sm text-foreground/60">{BUSINESS.email}</p>
            </div>
            <a href={`mailto:${BUSINESS.email}`}>
              <Button variant="outline" size="sm">
                Email
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}