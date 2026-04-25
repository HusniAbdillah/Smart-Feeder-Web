import type { WQIStatus } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: WQIStatus;
  size?: "sm" | "md" | "lg";
}

const STATUS_CONFIG: Record<WQIStatus, { label: string; className: string }> = {
  safe:     { label: "Aman",    className: "bg-status-safe text-white" },
  warning:  { label: "Waspada", className: "bg-status-warning text-primary" },
  critical: { label: "Kritis",  className: "bg-status-critical text-white" },
};

const SIZE_CONFIG: Record<NonNullable<StatusBadgeProps["size"]>, string> = {
  sm: "px-3 py-1 text-xs",
  md: "px-4 py-1.5 text-sm",
  lg: "px-6 py-2 text-base",
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tracking-wide",
        className,
        SIZE_CONFIG[size],
      )}
    >
      {label}
    </span>
  );
}
