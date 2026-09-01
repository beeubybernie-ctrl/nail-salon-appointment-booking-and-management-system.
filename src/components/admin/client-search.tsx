"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ClientSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.currentTarget as HTMLFormElement);
    const q = (form.get("q") as string)?.trim() ?? "";
    router.push(q ? `/admin/clients?q=${encodeURIComponent(q)}` : `/admin/clients`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
      <Input
        name="q"
        defaultValue={initialQuery}
        placeholder="Search by name, phone or email"
        className="pl-10"
      />
    </form>
  );
}