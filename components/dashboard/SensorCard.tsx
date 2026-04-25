import type { ReactNode } from "react";
import type { WQIStatus } from "@/types";
import { cn } from "@/lib/utils";

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: ReactNode;
  status: WQIStatus;
}

const BORDER_CLASS: Record<WQIStatus, string> = {
  safe:     "border-status-safe",
  warning:  "border-status-warning",
  critical: "border-status-critical",
};

const ICON_CLASS: Record<WQIStatus, string> = {
  safe:     "text-status-safe",
  warning:  "text-status-warning",
  critical: "text-status-critical",
};

const VALUE_CLASS: Record<WQIStatus, string> = {
  safe:     "text-status-safe",
  warning:  "text-status-warning",
  critical: "text-status-critical",
};

export function SensorCard({ title, value, unit, icon, status }: SensorCardProps) {
  const displayValue =
    typeof value === "number" ? value.toFixed(1) : value;

  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 rounded-2xl bg-surface p-6 shadow-sm",
        "border-l-4",
        BORDER_CLASS[status],
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold uppercase tracking-widest text-text-main/50">
          {title}
        </p>
        <span className={cn("shrink-0", ICON_CLASS[status])}>
          {icon}
        </span>
      </div>

      <div className="flex items-end gap-2 leading-none">
        <span
          className={cn(
            "text-5xl font-black tabular-nums",
            VALUE_CLASS[status],
          )}
        >
          {displayValue}
        </span>
        {unit && (
          <span className="mb-1 text-lg font-semibold text-text-main/40">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
