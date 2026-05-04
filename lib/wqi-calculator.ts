import type { SmartFeederSensorData, WQIResult, WQIStatus } from "@/types";

export const RULES = {
  temp: { min: 26, max: 32 },
  ph: { min: 7.0, max: 8.5 },
  do: { min: 4, max: 6 },
} as const;

// WQI weights based on aquaculture literature
const WEIGHTS = { do: 0.4, ph: 0.3, temp: 0.3 } as const;

const MIN_SCORE = 10;
const MAX_SCORE = 100;

const FALLOFF_FACTOR = 2; // outer bounds = ideal ± span * FALLOFF_FACTOR

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function outerBounds(min: number, max: number) {
  const span = max - min;
  return { outerMin: min - span * FALLOFF_FACTOR, outerMax: max + span * FALLOFF_FACTOR };
}

/** Generic linear scoring helper
 * - Returns 100 inside ideal range
 * - Linearly interpolates to MIN_SCORE at outer bounds
 * - Returns MIN_SCORE beyond outer bounds
 */
function calcScoreGeneric(value: number, rule: { min: number; max: number }): number {
  const { min, max } = rule;
  if (value >= min && value <= max) return MAX_SCORE;

  const { outerMin, outerMax } = outerBounds(min, max);

  if (value < min) {
    if (value <= outerMin) return MIN_SCORE;
    const ratio = (min - value) / (min - outerMin); // 0..1
    return clamp(MAX_SCORE - (MAX_SCORE - MIN_SCORE) * ratio, MIN_SCORE, MAX_SCORE);
  }

  // value > max
  if (value >= outerMax) return MIN_SCORE;
  const ratio = (value - max) / (outerMax - max);
  return clamp(MAX_SCORE - (MAX_SCORE - MIN_SCORE) * ratio, MIN_SCORE, MAX_SCORE);
}

function normalizedDistance(value: number, min: number, max: number): number {
  // 0 = inside ideal range, increasing as value moves away; 1+ when beyond outer bounds
  if (value >= min && value <= max) return 0;
  const { outerMin, outerMax } = outerBounds(min, max);
  if (value < min) return (min - value) / (min - outerMin);
  return (value - max) / (outerMax - max);
}

export function calcDOScore(do_ppm: number): number {
  return calcScoreGeneric(do_ppm, RULES.do);
}

export function calcPhScore(ph: number): number {
  return calcScoreGeneric(ph, RULES.ph);
}

export function calcTempScore(tempC: number): number {
  return calcScoreGeneric(tempC, RULES.temp);
}

/**
 * Calculates Water Quality Index (WQI) for aquaculture.
 * Uses DO, pH, and weighted average temperature (T_avg).
 */
export function calculateWQI(data: SmartFeederSensorData): WQIResult {
  // Weighted average temperature (middle layer weighted double)
  const tempAvg = (data.surfaceTemp + 2 * data.midTemp + data.bottomTemp) / 4;

  const doScore = calcDOScore(data.dissolvedOxygen);
  const phScore = calcPhScore(data.ph);
  const tempScore = calcTempScore(tempAvg);

  const raw = WEIGHTS.do * doScore + WEIGHTS.ph * phScore + WEIGHTS.temp * tempScore;
  const score = round1(raw);

  let status: WQIStatus;
  let label: string;

  if (score >= 80) {
    status = "safe";
    label = "Aman";
  } else if (score >= 60) {
    status = "warning";
    label = "Waspada";
  } else {
    status = "critical";
    label = "Kritis";
  }

  return {
    score,
    status,
    label,
    doScore: round1(doScore),
    phScore: round1(phScore),
    tempScore: round1(tempScore),
  };
}

/** Generate insight string based on the worst parameter (DO, pH, or Temp).

 */
export function getRecommendation(data: SmartFeederSensorData): string {
  const tempAvg = (data.surfaceTemp + 2 * data.midTemp + data.bottomTemp) / 4;

  const priorities = [
    { param: "temp" as const, severity: normalizedDistance(tempAvg, RULES.temp.min, RULES.temp.max) },
    { param: "ph" as const, severity: normalizedDistance(data.ph, RULES.ph.min, RULES.ph.max) },
    { param: "do" as const, severity: normalizedDistance(data.dissolvedOxygen, RULES.do.min, RULES.do.max) },
  ];

  const worst = priorities.reduce((a, b) => (a.severity >= b.severity ? a : b));

  switch (worst.param) {
    case "temp": {
      const val = tempAvg.toFixed(1);
      if (tempAvg >= RULES.temp.min && tempAvg <= RULES.temp.max) {
        return `Suhu rata-rata air berada dalam rentang baik (${val} C).`;
      }
      if (tempAvg > RULES.temp.max) {
        return `Suhu rata-rata air terlalu tinggi (${val} C). Lakukan pendinginan pada air tambak/masukkan sumber air dingin ke dalam tambak!`;
      }
      return `Suhu rata-rata air terlalu rendah (${val} C). Lakukan pemanasan pada air tambak/masukkan sumber air panas ke dalam tambak!`;
    }

    case "ph": {
      const val = data.ph.toFixed(1);
      if (data.ph >= RULES.ph.min && data.ph <= RULES.ph.max) {
        return `Keasaman (pH) air berada dalam rentang baik (${val}).`;
      }
      if (data.ph > RULES.ph.max) {
        return `Air terlalu basa (pH tinggi) (${val}). Lakukan pengapuran/pembersihan sisa pakan udang!`;
      }
      return `Air terlalu asam (pH rendah) (${val}). Segera ganti air tambak anda!`;
    }

    case "do": {
      const val = data.dissolvedOxygen.toFixed(1);
      if (data.dissolvedOxygen >= RULES.do.min && data.dissolvedOxygen <= RULES.do.max) {
        return `Kadar oksigen berada dalam kondisi baik (${val} ppm).`;
      }
      if (data.dissolvedOxygen > RULES.do.max) {
        return `Kadar oksigen terlalu tinggi (${val} ppm). Kurangi kecepatan aerator/kincir air!`;
      }
      return `Kadar oksigen terlalu rendah (${val} ppm). Nyalakan/tingkatkan kecepatan aerator/kincir air!`;
    }
  }
}

export const generateInsights = getRecommendation;

/**
 * Utility: Check for temperature stratification (difference between layers).
 * If delta > threshold (e.g. 2°C), flag for aeration.
 */
export function checkStratification(surface: number, middle: number, bottom: number, threshold = 2): boolean {
  const delta12 = Math.abs(surface - middle);
  const delta23 = Math.abs(middle - bottom);
  return delta12 > threshold || delta23 > threshold;
}

export function getTemperatureStatus(tempC: number): WQIStatus {
  if (tempC >= RULES.temp.min && tempC <= RULES.temp.max) return "safe";
  const { outerMin, outerMax } = outerBounds(RULES.temp.min, RULES.temp.max);
  if (tempC < outerMin || tempC > outerMax) return "critical";
  return "warning";
}

export function getDOStatus(do_ppm: number): WQIStatus {
  if (do_ppm >= RULES.do.min && do_ppm <= RULES.do.max) return "safe";
  const { outerMin, outerMax } = outerBounds(RULES.do.min, RULES.do.max);
  if (do_ppm < outerMin || do_ppm > outerMax) return "critical";
  return "warning";
}

export function getPhStatus(ph: number): WQIStatus {
  if (ph >= RULES.ph.min && ph <= RULES.ph.max) return "safe";
  const { outerMin, outerMax } = outerBounds(RULES.ph.min, RULES.ph.max);
  if (ph < outerMin || ph > outerMax) return "critical";
  return "warning";
}

/**
 * Analisis stratifikasi suhu kolam.
 * Stratifikasi = beda suhu antar lapisan > threshold (default 2°C).
 * Stratifikasi tinggi = air kurang tercampur, DO dasar bisa rendah, risiko stres/kematian ikan meningkat.
 * @returns { stratified: boolean, message: string, delta12: number, delta23: number }
 */
export function getStratificationStatus(
  surface: number,
  middle: number,
  bottom: number,
  threshold = 2,
): { stratified: boolean; message: string; delta12: number; delta23: number } {
  const delta12 = Math.abs(surface - middle);
  const delta23 = Math.abs(middle - bottom);
  const stratified = delta12 > threshold || delta23 > threshold;
  let message = "";
  if (stratified) {
    message = `Stratifikasi suhu terdeteksi!\n\nBeda suhu antar lapisan: permukaan-tengah = ${delta12.toFixed(1)}°C, tengah-dasar = ${delta23.toFixed(1)}°C.\n\nStratifikasi dapat menyebabkan DO rendah di dasar kolam. Segera lakukan aerasi atau pengadukan air.`;
  } else {
    message = `Tidak ada stratifikasi suhu signifikan. Air kolam tercampur baik.`;
  }
  return { stratified, message, delta12, delta23 };
}