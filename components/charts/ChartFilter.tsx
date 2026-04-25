"use client";

import { cn } from "@/lib/utils";
import type { FilterRange } from "@/types";

interface ChartFilterProps {
  activeFilter: FilterRange;
  onChange: (range: FilterRange) => void;
}

const filters: { label: string; value: FilterRange }[] = [
  { label: "1 Jam", value: "1h" },
  { label: "1 Hari", value: "1d" },
  { label: "1 Mgg", value: "1w" },
  { label: "1 Bln", value: "1m" },
  { label: "Semua", value: "all" },
];

export function ChartFilter({ activeFilter, onChange }: ChartFilterProps) {
  return (
    <div className="flex w-full overflow-x-auto hide-scrollbar touch-pan-x mb-4 pb-1 -mx-2 px-2 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1.5 p-1 bg-surface/50 border border-text-main/5 rounded-xl w-max">
        {filters.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => onChange(f.value)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap min-w-[44px]",
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-main/60 hover:text-text-main hover:bg-surface"
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
