"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function BlockedTimeItem({
  id,
  title,
  dateLabel,
  start,
  end,
  notes,
}: {
  id: string;
  title: string;
  dateLabel: string;
  start: string;
  end: string;
  notes: string | null;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    try {
      await fetch(`/api/admin/blocked-time/${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-foreground/60">
            {dateLabel} · {start} – {end}
          </p>
          {notes && <p className="text-sm text-foreground/50">{notes}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={remove} disabled={deleting} className="text-red-600 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}