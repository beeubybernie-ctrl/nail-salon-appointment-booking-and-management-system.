import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary-dark",
        confirmed: "bg-green-100 text-green-800",
        pending: "bg-amber-100 text-amber-800",
        completed: "bg-blue-100 text-blue-800",
        cancelled: "bg-red-100 text-red-700",
        no_show: "bg-zinc-100 text-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export type AppointmentStatus =
  | "CONFIRMED"
  | "PENDING"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No Show",
};

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "confirmed" | "pending" | "completed" | "cancelled" | "no_show"> = {
    CONFIRMED: "confirmed",
    PENDING: "pending",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    NO_SHOW: "no_show",
  };
  return (
    <Badge variant={map[status] ?? "default"}>
      {STATUS_LABELS[status as AppointmentStatus] ?? status}
    </Badge>
  );
}