"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordChange() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function changePassword() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Something went wrong." });
        return;
      }
      setMessage({
        type: "success",
        text: "Password changed. Please log in again with your new password.",
      });
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch {
      setMessage({ type: "error", text: "Something went wrong." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Admin Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <p
            className={`rounded-lg p-3 text-sm ${
              message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}
          >
            {message.text}
          </p>
        )}
        <div>
          <Label>Current password</Label>
          <Input
            type="password"
            className="mt-1"
            value={form.currentPassword}
            onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
          />
        </div>
        <div>
          <Label>New password</Label>
          <Input
            type="password"
            className="mt-1"
            value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
          />
          <p className="mt-1 text-xs text-foreground/50">At least 8 characters.</p>
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input
            type="password"
            className="mt-1"
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          />
        </div>
        <Button variant="outline" onClick={changePassword} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          {saving ? "Changing..." : "Change Password"}
        </Button>
      </CardContent>
    </Card>
  );
}