/**
 * Server-only email sending via Resend HTTP API.
 * Reliable on Vercel serverless (SMTP/Gmail cannot resolve DNS inside the
 * function runtime). Uses fetch() so there are no Node-only built-ins.
 *
 * Configure via env:
 *   RESEND_API_KEY   (Resend account secret key)
 *   EMAIL_FROM       (verified sender, e.g. Bee-U by Bernie <onboarding@resend.dev>
 *                     or a verified sender on your domain)
 *   BUSINESS_EMAIL   (recipient for admin booking alerts)
 */
const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
const EMAIL_FROM = (process.env.EMAIL_FROM || "").trim() || "onboarding@resend.dev";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://bee-u-app.vercel.app").trim().replace(/\/+$/, "");

export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}

/**
 * Sends an email via Resend HTTP API. Returns "SENT" or "NOT_CONFIGURED".
 * Never throws — errors are logged and swallowed so bookings still succeed.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<"SENT" | "NOT_CONFIGURED"> {
  if (!isEmailConfigured()) return "NOT_CONFIGURED";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      ...(opts.html ? { html: opts.html } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Resend send failed:", res.status, errText);
    return "NOT_CONFIGURED";
  }
  return "SENT";
}

export interface EmailMessageData {
  bookingRef: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
}

export async function sendBookingEmail(options: {
  to: string;
  subject: string;
  body: string;
  html?: string;
}): Promise<{ sent: boolean }> {
  const result = await sendEmail({
    to: options.to,
    subject: options.subject,
    text: options.body,
    html: options.html,
  });
  return { sent: result === "SENT" };
}

export function bookingRequestAdminEmailHtml(data: EmailMessageData & { clientName?: string; clientPhone?: string; clientEmail?: string }): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #2d2d2d;">
      <div style="background: #fdf7ec; padding: 24px 28px; border-radius: 12px; border: 1px solid #e8d8bc;">
        <h2 style="margin: 0 0 8px; font-size: 20px; color: #b8860b;">New Booking Request</h2>
        <p style="margin: 0; font-size: 14px; color: #666;">Bee-U by Bernie</p>
      </div>
      <div style="padding: 24px 28px; background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 12px; font-size: 14px;">A client has submitted a new booking request that needs your approval.</p>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888;">Client</td><td style="padding: 6px 0; font-weight: 600;">${data.clientName || "N/A"}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Phone</td><td style="padding: 6px 0;">${data.clientPhone || "N/A"}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Email</td><td style="padding: 6px 0;">${data.clientEmail || "N/A"}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Service</td><td style="padding: 6px 0; font-weight: 600;">${data.serviceName}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Date</td><td style="padding: 6px 0;">${data.date}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Time</td><td style="padding: 6px 0;">${data.startTime} – ${data.endTime}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Price</td><td style="padding: 6px 0; font-weight: 600;">R${data.price}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Reference</td><td style="padding: 6px 0;">${data.bookingRef}</td></tr>
        </table>
        <p style="margin: 20px 0 0; font-size: 13px; color: #888;">
          Log in to your admin dashboard to confirm or decline this booking.
        </p>
        <p style="margin: 16px 0 0;">
          <a href="${APP_URL}/admin/login"
             style="display:inline-block; background:#b8860b; color:#fff; padding:10px 24px; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600;">
            Sign In to Admin Portal
          </a>
        </p>
        <p style="margin: 24px 0 0; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px;">
          Be You. Be Beautiful.
        </p>
      </div>
    </div>`;
}

export function bookingConfirmedClientEmailHtml(data: EmailMessageData): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; color: #2d2d2d;">
      <div style="background: #e8f5e9; padding: 24px 28px; border-radius: 12px; border: 1px solid #c8e6c9;">
        <h2 style="margin: 0 0 8px; font-size: 20px; color: #2e7d32;">Your Appointment is Confirmed!</h2>
        <p style="margin: 0; font-size: 14px; color: #666;">Bee-U by Bernie</p>
      </div>
      <div style="padding: 24px 28px; background: #fff; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 12px; font-size: 14px;">Great news! Your booking has been confirmed.</p>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #888;">Service</td><td style="padding: 6px 0; font-weight: 600;">${data.serviceName}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Date</td><td style="padding: 6px 0;">${data.date}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Time</td><td style="padding: 6px 0;">${data.startTime} – ${data.endTime}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Price</td><td style="padding: 6px 0; font-weight: 600;">R${data.price}</td></tr>
          <tr><td style="padding: 6px 0; color: #888;">Reference</td><td style="padding: 6px 0;">${data.bookingRef}</td></tr>
        </table>
        <p style="margin: 20px 0 0; font-size: 13px; color: #888;">We look forward to seeing you!</p>
        <p style="margin: 24px 0 0; font-size: 12px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px;">
          Be You. Be Beautiful.
        </p>
      </div>
    </div>`;
}
