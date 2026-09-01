import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Admin Login | Bee-U by Bernie",
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}