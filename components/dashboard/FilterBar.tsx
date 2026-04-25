"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FilterRange } from "@/types";

const filters: { label: string; value: FilterRange }[] = [
  { label: "1 Jam", value: "1h" },
  { label: "1 Hari", value: "1d" },
  { label: "1 Minggu", value: "1w" },
  { label: "1 Bulan", value: "1m" },
  { label: "Semua", value: "all" },
];

export function FilterBar() {
  const searchParams = useSearchParams();
  const currentRange = (searchParams.get("range") as FilterRange) || "1h";

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <span className="text-sm font-semibold uppercase tracking-widest text-text-main/50 flex items-center mr-2">
        Filter Waktu:
      </span>
      {filters.map((filter) => (
        <Link
          key={filter.value}
          href={`/?range=${filter.value}`}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors",
            currentRange === filter.value
              ? "bg-primary text-white shadow-md"
              : "bg-surface text-text-main/70 hover:bg-surface/80 hover:text-text-main"
          )}
        >
          {filter.label}
        </Link>
      ))}
    </div>
  );
}
