"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Gift } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PRESETS = [100, 150, 200, 250, 300, 500];

export function GiftVoucherForm() {
  const [form, setForm] = useState<{
    amount: string;
    recipientName: string;
    recipientPhone: string;
    message: string;
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
  }>({
    amount: "250",
    recipientName: "",
    recipientPhone: "",
    message: "",
    buyerName: "",
    buyerPhone: "",
    buyerEmail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    const amt = Number(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt <= 0)
      e.amount = "Please enter a voucher value.";
    if (form.recipientName.trim().length < 2)
      e.recipientName = "Please enter the recipient's name.";
    if (form.buyerName.trim().length < 2)
      e.buyerName = "Please enter your name.";
    if (form.buyerPhone.trim().length < 7)
      e.buyerPhone = "Please enter a valid cellphone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.buyerEmail))
      e.buyerEmail = "Please enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/gift-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(form.amount),
          recipientName: form.recipientName.trim(),
          recipientPhone: form.recipientPhone.trim(),
          message: form.message.trim(),
          buyerName: form.buyerName.trim(),
          buyerPhone: form.buyerPhone.trim(),
          buyerEmail: form.buyerEmail.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setResult(data.voucher?.voucherNo || "Gift voucher requested");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <Check className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="mt-6 font-serif-display text-2xl font-semibold">
          Gift Voucher Requested!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-foreground/60">
          Thank you! Your gift voucher request ({result}) has been received.
          We&apos;ll be in touch with payment details, and once payment
          reflects we&apos;ll send your voucher via WhatsApp.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setResult(null)}>
          Request another voucher
        </Button>
      </div>
    );
  }

  const amountNum = Number(form.amount);
  const amountValid = !Number.isNaN(amountNum) && amountNum > 0;

  return (
    <div className="space-y-4">
      {/* Value */}
      <div>
        <Label htmlFor="amount">Voucher Value (R)</Label>
        <Input
          id="amount"
          type="number"
          inputMode="decimal"
          min={1}
          value={form.amount}
          onChange={(e) => set("amount", e.target.value)}
          className={cn(errors.amount && "border-red-400")}
          placeholder="e.g. 250"
        />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
        {amountValid && (
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => set("amount", p.toString())}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-semibold transition",
                  Number(form.amount) === p
                    ? "border-primary bg-primary/10 text-primary-dark"
                    : "border-primary/15 bg-white text-foreground/70 hover:border-primary/40"
                )}
              >
                R{p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recipient */}
      <div>
        <Label htmlFor="recipientName">Recipient Name</Label>
        <Input
          id="recipientName"
          value={form.recipientName}
          onChange={(e) => set("recipientName", e.target.value)}
          placeholder="Who is the voucher for?"
          className={cn(errors.recipientName && "border-red-400")}
        />
        {errors.recipientName && (
          <p className="mt-1 text-xs text-red-600">{errors.recipientName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="recipientPhone" className="mb-1.5 flex items-center gap-1">
          Recipient Phone <span className="text-xs font-normal text-foreground/50">(optional — for the voucher)</span>
        </Label>
        <Input
          id="recipientPhone"
          value={form.recipientPhone}
          onChange={(e) => set("recipientPhone", e.target.value)}
          placeholder="e.g. 082 123 4567"
        />
      </div>

      <div>
        <Label htmlFor="message" className="mb-1.5 flex items-center gap-1">
          Your Message <span className="text-xs font-normal text-foreground/50">(optional)</span>
        </Label>
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder="A note to appear on the voucher…"
          maxLength={500}
          className="min-h-20"
        />
      </div>

      {/* Buyer / Your details */}
      <hr className="border-primary/10" />

      <div>
        <Label htmlFor="buyerName">Your Name</Label>
        <Input
          id="buyerName"
          value={form.buyerName}
          onChange={(e) => set("buyerName", e.target.value)}
          placeholder="Your full name"
          className={cn(errors.buyerName && "border-red-400")}
        />
        {errors.buyerName && <p className="mt-1 text-xs text-red-600">{errors.buyerName}</p>}
      </div>

      <div>
        <Label htmlFor="buyerPhone">Your Cellphone Number</Label>
        <Input
          id="buyerPhone"
          value={form.buyerPhone}
          onChange={(e) => set("buyerPhone", e.target.value)}
          placeholder="e.g. 082 123 4567"
          className={cn(errors.buyerPhone && "border-red-400")}
        />
        {errors.buyerPhone && (
          <p className="mt-1 text-xs text-red-600">{errors.buyerPhone}</p>
        )}
      </div>

      <div>
        <Label htmlFor="buyerEmail">Your Email Address</Label>
        <Input
          id="buyerEmail"
          type="email"
          value={form.buyerEmail}
          onChange={(e) => set("buyerEmail", e.target.value)}
          placeholder="e.g. you@example.com"
          className={cn(errors.buyerEmail && "border-red-400")}
        />
        {errors.buyerEmail && (
          <p className="mt-1 text-xs text-red-600">{errors.buyerEmail}</p>
        )}
      </div>

      <div className="rounded-xl bg-amber-50 p-4 text-xs text-foreground/70">
        After you submit, we&apos;ll contact you with payment details. Your
        voucher is sent via WhatsApp once payment reflects.
      </div>

      <Button className="w-full gap-2" disabled={busy} onClick={submit}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Requesting voucher…
          </>
        ) : (
          <>
            <Gift className="mr-1 h-4 w-4" /> Request Gift Voucher
          </>
        )}
      </Button>
    </div>
  );
}