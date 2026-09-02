import { NextResponse } from "next/server";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "bee-u-bernie-verify";

/**
 * GET — Meta's webhook verification handshake.
 * Meta calls this with ?hub.mode=subscribe&hub.verify_token=...&hub.challenge=...
 * We must echo back hub.challenge if the verify token matches.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Verification failed", { status: 403 });
}

/**
 * POST — inbound WhatsApp messages from clients.
 * Meta delivers a JSON payload here when a client messages the business
 * number. For now we acknowledge delivery; optional reply handling later.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("WhatsApp webhook payload:", JSON.stringify(body));
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
