import { Suspense } from "react";
import Image from "next/image";
import { ThermometerSimple } from "@phosphor-icons/react/dist/ssr/ThermometerSimple";
import { Thermometer } from "@phosphor-icons/react/dist/ssr/Thermometer";
import { ThermometerCold } from "@phosphor-icons/react/dist/ssr/ThermometerCold";
import { Drop } from "@phosphor-icons/react/dist/ssr/Drop";
import { TestTube } from "@phosphor-icons/react/dist/ssr/TestTube";
import { Ruler } from "@phosphor-icons/react/dist/ssr/Ruler";

import { fetchThingSpeakFeeds } from "@/lib/thingspeak";
import {
  calculateWQI,
  generateInsights,
  getTemperatureStatus,
  getDOStatus,
  getPhStatus,
} from "@/lib/wqi-calculator";
import { AutoRefresh } from "@/components/dashboard/AutoRefresh";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { ExportControls } from "@/components/dashboard/ExportControls";
import { TemperatureChart } from "@/components/charts/TemperatureChart";
import { CorrelationChart } from "@/components/charts/CorrelationChart";
import { PhChart } from "@/components/charts/PhChart";
import { cn } from "@/lib/utils";
import type { ApiDataResponse, WQIStatus } from "@/types";

import logoImg from "./logo.png";

const WQI_HERO_STYLE: Record<WQIStatus, string> = {
  safe: "border-status-safe bg-status-safe/10",
  warning: "border-status-warning bg-status-warning/10",
  critical: "border-status-critical bg-status-critical/10",
};

async function DashboardContent() {
  let result: ApiDataResponse | null = null;

  try {
    result = await fetchThingSpeakFeeds("all");
  } catch {
  }

  if (!result || result.history.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl bg-surface p-10 text-center shadow-sm">
        <p className="text-xl font-semibold text-text-main/60">
          Menunggu data dari sensor...
        </p>
        <p className="text-sm text-text-main/40">
          Pastikan sensor aktif dan konfigurasi ThingSpeak sudah benar.
        </p>
      </div>
    );
  }


  const { latest, history, trends, fetchedAt } = result;
  const wqi = calculateWQI(latest);
  const insight = generateInsights(latest);

  // --- Stratification analysis ---
  const { getStratificationStatus } = await import("@/lib/wqi-calculator");
  const strat = getStratificationStatus(
    latest.surfaceTemp,
    latest.midTemp,
    latest.bottomTemp
  );

  const subScores = [
    { label: "Oksigen Terlarut", score: wqi.doScore },
    { label: "pH Air", score: wqi.phScore },
    { label: "Suhu", score: wqi.tempScore },
  ];

  const latestTimestamp = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(latest.timestamp));

  const latestReadings = [
    { label: "Suhu Permukaan", value: `${latest.surfaceTemp.toFixed(1)} °C` },
    { label: "Suhu Tengah", value: `${latest.midTemp.toFixed(1)} °C` },
    { label: "Suhu Dasar", value: `${latest.bottomTemp.toFixed(1)} °C` },
    { label: "Oksigen Terlarut", value: `${latest.dissolvedOxygen.toFixed(1)} ppm` },
    { label: "pH Air", value: latest.ph.toFixed(1) },
    { label: "Kedalaman", value: `${latest.depth.toFixed(2)} m` },
  ];

  const updatedAt = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "Asia/Jakarta"
  }).format(new Date(fetchedAt));

  return (
    <div className="space-y-8">
      {/* ── Header & Top Controls ──────────────────────────────── */}
      <header className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between mb-12">
        <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-6">
          <div className="relative shrink-0">
            <Image 
              src={logoImg} 
              alt="Smart Feeder Logo" 
              width={120} 
              height={120} 
              className="drop-shadow-lg rounded-full w-20 h-20 md:w-32 md:h-32 border-4 border-surface"
              priority
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-6xl font-black tracking-tight text-primary">
              Smart Feeder
            </h1>
            <p className="mt-1 text-xs md:text-xl font-bold text-text-main/60">
              Pemantauan Kualitas Air Real-time Berbasis IoT
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 pt-2">
          <div className="text-[11px] md:text-sm font-bold uppercase tracking-wider text-text-main/60 whitespace-nowrap bg-surface px-3 py-1.5 rounded-full border border-text-main/5 shadow-sm">
            Terakhir diperbarui: {updatedAt}
          </div>
          <ExportControls data={history} />
        </div>
      </header>

      {/* WQI Hero */}
      <section
        className={cn(
          "rounded-3xl border-2 p-6 sm:p-8 shadow-sm transition-all duration-300",
          WQI_HERO_STYLE[wqi.status],
        )}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-center">
          {/* Left Side: Main Score */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="shrink-0">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-text-main/60">
                WQI Indeks
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tabular-nums text-text-main sm:text-7xl">
                  {wqi.score}
                </span>
                <span className="text-[10px] font-medium text-text-main/60 uppercase">Score</span>
              </div>
            </div>
            
            <div className="h-10 w-px bg-text-main/20" />
            
            <div className="flex flex-col gap-1">
              <StatusBadge status={wqi.status} size="md" />
              <span className="text-[9px] font-bold text-text-main/60 uppercase tracking-tight">
                Kondisi Air
              </span>
            </div>
          </div>

          {/* Right Side: Sub-scores Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-6 border-t border-text-main/10 pt-4 md:border-t-0 md:pt-0">
            {subScores.map(({ label, score }) => (
              <div key={label} className="flex flex-col">
                <span className="text-[11px] sm:text-[13px] font-bold uppercase tracking-tight text-text-main/60 line-clamp-1">
                  {label}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-text-main">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable insight */}
        <div className="mt-6 border-t border-text-main/10 pt-5 space-y-4">
          <p className="text-sm sm:text-base font-medium leading-relaxed text-text-main/75">
            {insight}
          </p>
          <div
            className={
              strat.stratified
                ? "rounded-xl border-l-4 border-status-warning bg-status-warning/10 p-4"
                : "rounded-xl border-l-4 border-status-safe bg-status-safe/10 p-4"
            }
          >
            <div className="font-semibold mb-1 text-sm text-text-main/70">
              Stratifikasi Suhu Kolam
            </div>
            <div className="text-sm whitespace-pre-line text-text-main/80">
              {strat.message}
            </div>
          </div>
        </div>
      </section>

      {/* ── Sensor Grid ──────────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg sm:text-xl font-bold text-text-main px-1">
          Data Sensor Terkini
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <SensorCard
            title="Suhu Permukaan"
            value={latest.surfaceTemp}
            unit="°C"
            icon={<ThermometerSimple size={32} weight="fill" />}
            status={getTemperatureStatus(latest.surfaceTemp)}
            trend={trends?.surfaceTemp}
          />
          <SensorCard
            title="Suhu Tengah"
            value={latest.midTemp}
            unit="°C"
            icon={<Thermometer size={32} weight="fill" />}
            status={getTemperatureStatus(latest.midTemp)}
            trend={trends?.midTemp}
          />
          <SensorCard
            title="Suhu Dasar"
            value={latest.bottomTemp}
            unit="°C"
            icon={<ThermometerCold size={32} weight="fill" />}
            status={getTemperatureStatus(latest.bottomTemp)}
            trend={trends?.bottomTemp}
          />
          <SensorCard
            title="Oksigen Terlarut (DO)"
            value={latest.dissolvedOxygen}
            unit="ppm"
            icon={<Drop size={32} weight="fill" />}
            status={getDOStatus(latest.dissolvedOxygen)}
            trend={trends?.dissolvedOxygen}
          />
          <SensorCard
            title="pH Air"
            value={latest.ph}
            unit=""
            icon={<TestTube size={32} weight="fill" />}
            status={getPhStatus(latest.ph)}
            trend={trends?.ph}
          />
          <SensorCard
            title="Kedalaman"
            value={latest.depth}
            unit="m"
            icon={<Ruler size={32} weight="fill" />}
            status="safe"
            trend={trends?.depth}
          />
        </div>
      </section>

      <details className="rounded-3xl border border-text-main/8 bg-surface shadow-sm open:shadow-md">
        <summary className="cursor-pointer list-none px-5 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-text-main/45">
                Data Terakhir Terkirim Sensor
              </p>
              <h2 className="mt-1 text-lg sm:text-xl font-black text-text-main">
                Lihat data terakhir dari ThingSpeak
              </h2>
            </div>
            <div className="text-right">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-text-main/45">
                Total Sampel
              </span>
              <span className="mt-1 block text-base font-semibold text-text-main">
                {history.length}
              </span>
            </div>
          </div>
        </summary>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="rounded-2xl border border-text-main/8 bg-background px-4 py-3 text-sm text-text-main/70 shadow-sm">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-text-main/45">
              Update terakhir diterima
            </span>
            <span className="mt-1 block text-base font-semibold text-text-main">
              {latestTimestamp}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {latestReadings.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-text-main/8 bg-background px-4 py-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-wider text-text-main/45">
                  {item.label}
                </p>
                <p className="mt-1 text-lg font-black text-text-main">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </details>

      {/* ── Historical Charts ─────────────────────────────────── */}
      <section className="space-y-6">
        <div>
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-text-main px-1">
            Analisis Stratifikasi Suhu
          </h2>
          <div className="rounded-2xl bg-surface p-4 sm:p-6 shadow-sm overflow-hidden">
            <TemperatureChart initialData={history} />
          </div>
        </div>
        
        <div>
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-text-main px-1">
            Korelasi Suhu & Oksigen (DO)
          </h2>
          <div className="rounded-2xl bg-surface p-4 sm:p-6 shadow-sm overflow-hidden">
            <CorrelationChart initialData={history} />
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg sm:text-xl font-bold text-text-main px-1">
            Tren pH Air
          </h2>
          <div className="rounded-2xl bg-surface p-4 sm:p-6 shadow-sm overflow-hidden">
            <PhChart initialData={history} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <AutoRefresh intervalMs={30000} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="flex min-h-[80vh] items-center justify-center rounded-2xl bg-surface shadow-sm">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-lg font-medium text-text-main/60 animate-pulse">Memuat dashboard...</p>
              </div>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </main>
  );
}
