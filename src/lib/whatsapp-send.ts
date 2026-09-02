/**
 * Server-only Meta WhatsApp Cloud API sender.
 * NOT for client components. Sends real WhatsApp messages via
 * https://graph.facebook.com/v19.0/<PHONE_NUMBER_ID>/messages
 *
 * Configure via env:
 *   WHATSAPP_TOKEN            (Meta App access token from WABA)
 *   WHATSAPP_PHONE_NUMBER_ID  (Meta Business phone number ID)
 *   WHATSAPP_NUMBER           (the business phone number, e.g. 27672535540)
 */
import { BUSINESS } from "./business";

const GRAPH_URL = "https://graph.facebook.com/v19.0";

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const BUSINESS_NUMBER = process.env.WHATSAPP_NUMBER || BUSINESS.whatsapp;

/**
 * Normalises a phone number to international format without '+' or spaces.
 * South Africa: 27xxxxxxxxx.
 */
export function toWaId(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  return digits;
}

export function isWhatsAppConfigured(): boolean {
  return !!(TOKEN && PHONE_NUMBER_ID);
}

/**
 * Sends a plain-text WhatsApp message to a phone number.
 * Returns "SENT" | "NOT_CONFIGURED". Never throws.
 */
export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<"SENT" | "NOT_CONFIGURED"> {
  if (!isWhatsAppConfigured()) return "NOT_CONFIGURED";

  const toNumber = toWaId(to);
  if (!toNumber) return "NOT_CONFIGURED";

  try {
    const res = await fetch(`${GRAPH_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body },
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("WhatsApp send failed:", res.status, errText);
      return "NOT_CONFIGURED";
    }
    return "SENT";
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return "NOT_CONFIGURED";
  }
}

export { BUSINESS_NUMBER };
