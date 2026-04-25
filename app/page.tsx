import { Suspense } from "react";
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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SensorCard } from "@/components/dashboard/SensorCard";
import { TemperatureChart } from "@/components/charts/TemperatureChart";
import { cn } from "@/lib/utils";
import type { ApiDataResponse, WQIStatus } from "@/types";

const WQI_HERO_STYLE: Record<WQIStatus, string> = {
  safe: "border-status-safe bg-status-safe/10",
  warning: "border-status-warning bg-status-warning/10",
  critical: "border-status-critical bg-status-critical/10",
};

async function DashboardContent() {
  let result: ApiDataResponse | null = null;

  try {
    result = await fetchThingSpeakFeeds();
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


  const { latest, history } = result;
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

  return (
    <div className="space-y-8">
      {/* WQI Hero */}
      <section
        className={cn(
          "rounded-3xl border-2 p-8 shadow-sm",
          WQI_HERO_STYLE[wqi.status],
        )}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          {/* Score block */}
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-text-main/50">
              Indeks Kualitas Air (WQI)
            </p>
            <div className="flex flex-wrap items-end gap-4">
              <span className="text-7xl font-black leading-none tabular-nums text-text-main sm:text-8xl">
                {wqi.score}
              </span>
              <div className="mb-2 flex flex-col items-start gap-2">
                <StatusBadge status={wqi.status} size="lg" />
                <span className="text-xs text-text-main/40">
                  skala 0 hingga 100
                </span>
              </div>
            </div>
          </div>

          {/* Sub-scores panel */}
          <div className="flex gap-8 lg:flex-col lg:items-end lg:gap-4">
            {subScores.map(({ label, score }) => (
              <div
                key={label}
                className="flex flex-col items-start gap-0.5 lg:items-end"
              >
                <span className="text-xs font-medium text-text-main/45">
                  {label}
                </span>
                <span className="text-2xl font-black tabular-nums text-text-main">
                  {score}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable insight */}
        <div className="mt-6 border-t border-text-main/10 pt-5 space-y-4">
          <p className="text-base font-medium leading-relaxed text-text-main/75">
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
        <h2 className="mb-5 text-xl font-bold text-text-main">
          Data Sensor Terkini
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SensorCard
            title="Suhu Permukaan"
            value={latest.surfaceTemp}
            unit="°C"
            icon={<ThermometerSimple size={32} weight="fill" />}
            status={getTemperatureStatus(latest.surfaceTemp)}
          />
          <SensorCard
            title="Suhu Tengah"
            value={latest.midTemp}
            unit="°C"
            icon={<Thermometer size={32} weight="fill" />}
            status={getTemperatureStatus(latest.midTemp)}
          />
          <SensorCard
            title="Suhu Dasar"
            value={latest.bottomTemp}
            unit="°C"
            icon={<ThermometerCold size={32} weight="fill" />}
            status={getTemperatureStatus(latest.bottomTemp)}
          />
          <SensorCard
            title="Oksigen Terlarut (DO)"
            value={latest.dissolvedOxygen}
            unit="ppm"
            icon={<Drop size={32} weight="fill" />}
            status={getDOStatus(latest.dissolvedOxygen)}
          />
          <SensorCard
            title="pH Air"
            value={latest.ph}
            unit=""
            icon={<TestTube size={32} weight="fill" />}
            status={getPhStatus(latest.ph)}
          />
          <SensorCard
            title="Kedalaman"
            value={latest.depth}
            unit="m"
            icon={<Ruler size={32} weight="fill" />}
            status="safe"
          />
        </div>
      </section>

      {/* ── Historical Chart ─────────────────────────────────── */}
      <section>
        <h2 className="mb-5 text-xl font-bold text-text-main">
          Analisis Stratifikasi Suhu
        </h2>
        <div className="rounded-2xl bg-surface p-6 shadow-sm">
          <TemperatureChart data={history} />
        </div>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black tracking-tight text-primary sm:text-4xl">
            Dashboard Smart Feeder
          </h1>
          <p className="mt-1.5 text-base text-text-main/60">
            Pemantauan Kualitas Air Real-time
          </p>
        </header>

        <Suspense
          fallback={
            <div className="flex min-h-72 items-center justify-center rounded-2xl bg-surface shadow-sm">
              <p className="text-lg text-text-main/50">Memuat data sensor...</p>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}
