import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { logNotification } from "@/lib/notifications-log";
import { sendEmail } from "@/lib/email-service";
import { BUSINESS } from "@/lib/business";
import { voucherNoFor, voucherValidUntil, voucherAmountLabel } from "@/lib/gift-voucher";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  amount: z.number().positive().max(1000000),
  recipientName: z.string().trim().min(2, "Please enter the recipient's name"),
  recipientPhone: z.string().trim().min(7).optional().default(""),
  message: z.string().trim().max(500).optional().default(""),
  buyerName: z.string().trim().min(2, "Please enter your name"),
  buyerPhone: z.string().trim().min(7, "Please enter a valid cellphone number"),
  buyerEmail: z.string().trim().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = (forwarded.split(",")[0] || "unknown").trim();
  if (!rateLimit(`voucher:${ip}`, 6, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Please check the highlighted fields." },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const purchasedAt = new Date();
  const validUntil = voucherValidUntil(purchasedAt);
  const amount = Math.round(data.amount * 100) / 100;
  const voucherNo = voucherNoFor(amount, purchasedAt);

  try {
    const existing = await prisma.giftVoucher.findUnique({
      where: { voucherNo },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Could not generate a unique voucher number. Please try again." },
        { status: 500 }
      );
    }

    const voucher = await prisma.giftVoucher.create({
      data: {
        voucherNo,
        amount,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone || null,
        message: data.message || null,
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerEmail: data.buyerEmail.toLowerCase(),
        status: "REQUESTED",
        purchasedAt,
        validUntil,
      },
    });

    await logAudit(
      "VOUCHER_REQUESTED",
      "GiftVoucher",
      voucher.id,
      `Voucher ${voucher.voucherNo} requested for ${voucher.recipientName} (${voucherAmountLabel(Number(voucher.amount))})`
    );

    await logNotification({
      type: "VOUCHER_REQUEST",
      recipient: "admin",
      subject: `New gift voucher request ${voucher.voucherNo}`,
      body: `Gift voucher ${voucher.voucherNo} requested for ${voucher.recipientName} worth ${voucherAmountLabel(Number(voucher.amount))}. Valid until ${validUntil.toLocaleDateString("en-ZA")}.`,
    });

    const adminBody = [
      `A gift voucher was requested.`,
      ``,
      `Voucher No: ${voucher.voucherNo}`,
      `Value: ${voucherAmountLabel(Number(voucher.amount))}`,
      `Recipient: ${voucher.recipientName}`,
      `Recipient Phone: ${voucher.recipientPhone || "-"}`,
      `Message: ${voucher.message || "-"}`,
      ``,
      `Buyer: ${voucher.buyerName}`,
      `Buyer Phone: ${voucher.buyerPhone}`,
      `Buyer Email: ${voucher.buyerEmail}`,
      ``,
      `Valid Until: ${validUntil.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`,
      ``,
      `Sign in to the admin portal to mark as paid, download and send this voucher.`,
    ].join("\n");

    await sendEmail({
      to: BUSINESS.email,
      subject: `New Gift Voucher Request ${voucher.voucherNo} — Bee-U by Bernie`,
      text: adminBody,
    });

    return NextResponse.json({
      voucher: {
        voucherNo: voucher.voucherNo,
        amount: Number(voucher.amount),
        recipientName: voucher.recipientName,
        validUntil: voucher.validUntil.toISOString(),
        status: voucher.status,
      },
    });
  } catch (error) {
    console.error("Gift voucher request error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}