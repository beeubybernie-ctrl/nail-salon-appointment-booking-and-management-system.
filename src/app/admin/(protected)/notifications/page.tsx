import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mail,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Bell,
  History,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ClearNotificationsButton } from "@/components/admin/clear-notifications-button";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const emailConfigured = !!(process.env.EMAIL_PROVIDER && process.env.EMAIL_API_KEY);
  const whatsappConfigured = !!(process.env.WHATSAPP_PROVIDER && process.env.WHATSAPP_API_KEY);

  const recent = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-4 sm:p-6">
      <h1 className="font-serif-display text-2xl font-semibold">Notifications</h1>
      <p className="text-sm text-foreground/60">
        Notification providers. These integrate with the booking flow.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-accent" /> Email Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emailConfigured ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span>Email provider configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700">
                <XCircle className="h-5 w-5" />
                <span>Email notifications disabled</span>
              </div>
            )}
            <p className="mt-3 text-sm text-foreground/60">
              {emailConfigured
                ? "Booking confirmations, cancellations and reschedules will be emailed."
                : "Set EMAIL_PROVIDER and EMAIL_API_KEY in your .env to enable automatic booking emails."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[#25a85c]" /> WhatsApp Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {whatsappConfigured ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span>WhatsApp provider configured</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-700">
                <XCircle className="h-5 w-5" />
                <span>WhatsApp notifications disabled</span>
              </div>
            )}
            <p className="mt-3 text-sm text-foreground/60">
              {whatsappConfigured
                ? "Clients will receive WhatsApp messages about their bookings."
                : "Set WHATSAPP_PROVIDER and WHATSAPP_API_KEY in your .env to enable automatic WhatsApp messages."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" /> Appointment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/60">
            The system is designed to send reminders{" "}
            <span className="font-medium">24 hours</span> before an appointment
            (configurable in Settings). A background process or provider is
            required to actually send reminders at the scheduled time. This is
            postponed until an email/WhatsApp/SMS provider is configured.
          </p>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-accent" /> Notification History
          </CardTitle>
          {recent.length > 0 && (
            <div className="mt-1">
              <ClearNotificationsButton />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No notifications recorded yet. New booking requests and
              confirmations will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-primary/10">
              {recent.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      {n.subject ?? n.type}
                    </p>
                    <span className="shrink-0 text-xs text-foreground/40">
                      {n.createdAt.toLocaleString("en-ZA")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/70">To: {n.recipient}</p>
                  {n.body && (
                    <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted/50 p-2 font-mono text-xs text-foreground/70">
                      {n.body}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}