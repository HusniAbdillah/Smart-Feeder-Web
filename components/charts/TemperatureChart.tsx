"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { SmartFeederSensorData } from "@/types";

interface TemperatureChartProps {
  data: SmartFeederSensorData[];
}

const LINES: { key: keyof SmartFeederSensorData; label: string; color: string }[] = [
  { key: "surfaceTemp", label: "Suhu Permukaan", color: "#1B4965" },
  { key: "midTemp", label: "Suhu Tengah", color: "#E9C46A" },
  { key: "bottomTemp", label: "Suhu Dasar", color: "#2A9D8F" },
];

function formatTimestamp(timestamp: string): string {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid rgba(16,42,67,0.12)",
        borderRadius: "12px",
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(16,42,67,0.10)",
        minWidth: "180px",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "rgba(16,42,67,0.50)",
          marginBottom: "8px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </p>
      {payload.map((entry, idx) => (
        <div
          key={String(entry.dataKey ?? entry.name ?? idx)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: entry.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "13px", color: "rgba(16,42,67,0.65)" }}>
            {entry.name}:
          </span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#102A43" }}>
            {Number(entry.value).toFixed(1)}&deg;C
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "20px",
        paddingTop: "14px",
      }}
    >
      {LINES.map((line) => (
        <div
          key={line.key}
          style={{ display: "flex", alignItems: "center", gap: "7px" }}
        >
          <span
            style={{
              display: "inline-block",
              width: "24px",
              height: "3px",
              borderRadius: "2px",
              backgroundColor: line.color,
            }}
          />
          <span style={{ fontSize: "13px", color: "#102A43", fontWeight: 500 }}>
            {line.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TemperatureChart({ data }: TemperatureChartProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "260px",
          color: "rgba(16,42,67,0.35)",
          fontSize: "15px",
        }}
      >
        Belum ada data historis tersedia.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    surfaceTemp: d.surfaceTemp,
    midTemp: d.midTemp,
    bottomTemp: d.bottomTemp,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="4 4"
          stroke="rgba(16,42,67,0.08)"
          vertical={false}
        />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 12, fill: "rgba(16,42,67,0.55)", fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(16,42,67,0.12)" }}
          dy={6}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={["auto", "auto"]}
          unit="°C"
          tick={{ fontSize: 12, fill: "rgba(16,42,67,0.55)", fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
        {LINES.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0, fill: line.color }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
