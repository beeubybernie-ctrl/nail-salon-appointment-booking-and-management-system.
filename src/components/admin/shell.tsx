"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
  Users,
  Sparkles,
  Menu as MenuIcon,
  Store,
  X,
  Settings,
  Bell,
  LogOut,
  Clock,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarClock },
  { label: "Clients", href: "/admin/clients", icon: Users },
  { label: "Services", href: "/admin/services", icon: Sparkles },
  { label: "Price List", href: "/admin/price-list", icon: ListChecks },
  { label: "Blocked Time", href: "/admin/blocked-time", icon: Clock },
  { label: "Business Hours", href: "/admin/business-hours", icon: Store },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const nav = (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-white"
                : "text-foreground/70 hover:bg-primary/10 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  const sidebarInner = (
    <>
      <div className="flex items-center gap-2 border-b border-primary/10 p-4">
        <Image
          src="/images/logo.png"
          alt="Bee-U by Bernie"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Bee-U by Bernie</p>
          <p className="text-xs text-foreground/50">Admin</p>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground/50 lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {nav}
        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-primary/10 bg-white lg:flex">
        {sidebarInner}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-primary/10 bg-white lg:hidden">
            {sidebarInner}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-primary/10 bg-white px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground"
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <Image
            src="/images/logo.png"
            alt="Bee-U by Bernie"
            width={30}
            height={30}
            className="rounded-full"
          />
          <span className="text-sm font-semibold">Bee-U by Bernie</span>
          <button
            onClick={handleLogout}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-red-600"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}