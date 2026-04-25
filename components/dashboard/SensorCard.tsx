import type { ReactNode } from "react";
import type { WQIStatus } from "@/types";
import { cn } from "@/lib/utils";
import { TrendUp } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { TrendDown } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { Minus } from "@phosphor-icons/react/dist/ssr/Minus";

interface SensorCardProps {
  title: string;
  value: number | string;
  unit: string;
  icon: ReactNode;
  status: WQIStatus;
  trend?: number;
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

export function SensorCard({ title, value, unit, icon, status, trend }: SensorCardProps) {
  const displayValue =
    typeof value === "number" ? value.toFixed(1) : value;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between gap-4 rounded-2xl bg-surface p-6 shadow-sm",
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

      <div className="flex flex-col gap-1">
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
        
        {typeof trend === "number" && (
          <div className="flex items-center gap-1 text-xs font-medium mt-2">
            {trend > 0 ? (
              <>
                <TrendUp weight="bold" className="text-status-warning" />
                <span className="text-text-main/60">
                  Naik <span className="font-bold">{Math.abs(trend).toFixed(1)}{unit}</span> dari 1 jam lalu
                </span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendDown weight="bold" className="text-status-safe" />
                <span className="text-text-main/60">
                  Turun <span className="font-bold">{Math.abs(trend).toFixed(1)}{unit}</span> dari 1 jam lalu
                </span>
              </>
            ) : (
              <>
                <Minus weight="bold" className="text-text-main/40" />
                <span className="text-text-main/40">Stabil dari 1 jam lalu</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
