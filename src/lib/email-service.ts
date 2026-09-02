/**
 * Server-only email sending utilities.
 * This file must NOT be imported by client components — it uses nodemailer
 * which depends on Node.js built-ins (net, tls, fs, etc.).
 */
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (_transporter) return _transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transporter;
}

export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * Sends an email via configured SMTP. Returns "SENT" or "NOT_CONFIGURED".
 * Never throws — errors are logged and swallowed so bookings still succeed.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<"SENT" | "NOT_CONFIGURED"> {
  const transporter = getTransporter();
  if (!transporter) return "NOT_CONFIGURED";
  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return "SENT";
  } catch (err) {
    console.error("Failed to send email:", err);
    return "NOT_CONFIGURED";
  }
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
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://bee-u-app.vercel.app"}/admin/appointments?filter=pending"
             style="display:inline-block; background:#b8860b; color:#fff; padding:10px 24px; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600;">
            View Pending Requests
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
