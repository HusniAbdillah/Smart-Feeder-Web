"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { SmartFeederSensorData, FilterRange, ApiDataResponse } from "@/types";
import { ChartFilter } from "./ChartFilter";
import { formatTimestamp } from "@/lib/format";

const COLORS = {
  ph: "#9D4EDD",
};

const LINES = [
  { key: "ph", label: "pH Air", color: COLORS.ph },
];

export function PhChart({ initialData }: { initialData?: SmartFeederSensorData[] }) {
  const [filter, setFilter] = useState<FilterRange>("1h");
  const [data, setData] = useState<SmartFeederSensorData[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
    ph: true,
  });

  const fetchData = useCallback(async (range: FilterRange) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/thingspeak?range=${range}`);
      const json: ApiDataResponse = await res.json();
      setData(json.history || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filter !== "1h" || !initialData) {
      fetchData(filter);
    } else {
      setData(initialData);
    }
  }, [filter, fetchData, initialData]);

  const toggleLine = (dataKey: string) => {
    setVisibleLines((prev) => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp, filter),
    ph: d.ph,
  }));

  const CustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 pt-4">
        {LINES.map((line) => {
          const isActive = visibleLines[line.key];
          return (
            <button
              key={line.key}
              onClick={() => toggleLine(line.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all min-h-[44px]"
              style={{
                borderColor: isActive ? line.color : "transparent",
                backgroundColor: isActive ? `${line.color}15` : "rgba(16,42,67,0.05)",
                opacity: isActive ? 1 : 0.5,
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: line.color }}
              />
              <span className="text-xs font-semibold text-text-main">
                {line.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full relative">
      <ChartFilter activeFilter={filter} onChange={setFilter} />

      {loading ? (
        <div className="flex items-center justify-center h-[280px] w-full animate-pulse bg-surface/50 rounded-xl">
          <p className="text-sm font-medium text-text-main/40">Memuat data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[280px] text-[15px] text-text-main/35">
          Belum ada data historis tersedia.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,42,67,0.08)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "rgba(16,42,67,0.5)", fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(16,42,67,0.1)" }}
              dy={8}
              minTickGap={20}
            />
            <YAxis
              domain={[0, 14]}
              tick={{ fontSize: 11, fill: "rgba(16,42,67,0.5)", fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 8px 24px rgba(16,42,67,0.12)",
                padding: "12px",
              }}
              itemStyle={{ fontSize: "13px", fontWeight: 600, padding: "2px 0" }}
              labelStyle={{ fontSize: "11px", fontWeight: 700, color: "rgba(16,42,67,0.5)", marginBottom: "4px", textTransform: "uppercase" }}
            />
            <Legend content={<CustomLegend />} />
            
            <ReferenceLine y={6.5} stroke="#E76F51" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Batas Bawah (6.5)', fill: '#E76F51', fontSize: 10 }} />
            <ReferenceLine y={8.5} stroke="#E76F51" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Batas Atas (8.5)', fill: '#E76F51', fontSize: 10 }} />
            
            <Line
              type="monotone"
              dataKey="ph"
              name="pH Air"
              stroke={COLORS.ph}
              strokeWidth={3}
              dot={false}
              hide={!visibleLines.ph}
              activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.ph }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
