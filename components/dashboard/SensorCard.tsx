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
        "relative flex flex-col justify-between gap-3 rounded-2xl bg-surface p-4 sm:p-6 shadow-sm",
        "border-l-4",
        BORDER_CLASS[status],
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wider text-text-main/60">
          {title}
        </p>
        <span className={cn("shrink-0 scale-90 sm:scale-125 origin-top-right", ICON_CLASS[status])}>
          {icon}
        </span>
      </div>

      <div className="flex flex-col gap-0">
        <div className="flex items-baseline gap-1 leading-none">
          <span
            className={cn(
              "text-4xl sm:text-6xl font-black tabular-nums",
              VALUE_CLASS[status],
            )}
          >
            {displayValue}
          </span>
          {unit && (
            <span className="text-sm sm:text-xl font-bold text-text-main/40">
              {unit}
            </span>
          )}
        </div>
        
        {typeof trend === "number" && (
          <div className="flex items-center gap-1 text-[11px] sm:text-sm font-semibold mt-3">
            {trend > 0 ? (
              <>
                <TrendUp weight="bold" className="text-status-warning shrink-0" />
                <span className="text-text-main/70 truncate">
                  <span className="font-bold">+{Math.abs(trend).toFixed(1)}</span> <span className="hidden sm:inline">lebih tinggi dari 1j lalu</span>
                </span>
              </>
            ) : trend < 0 ? (
              <>
                <TrendDown weight="bold" className="text-status-safe shrink-0" />
                <span className="text-text-main/70 truncate">
                  <span className="font-bold">-{Math.abs(trend).toFixed(1)}</span> <span className="hidden sm:inline">lebih rendah dari 1j lalu</span>
                </span>
              </>
            ) : (
              <>
                <Minus weight="bold" className="text-text-main/40 shrink-0" />
                <span className="text-text-main/50 truncate uppercase tracking-tighter">Stabil</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
