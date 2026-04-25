import type { SmartFeederSensorData, WQIResult, WQIStatus } from "@/types";

// WQI weights based on aquaculture literature:
// DO = 0.4 (most critical), pH = 0.3, Temp = 0.3
const WEIGHTS = { do: 0.4, ph: 0.3, temp: 0.3 } as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function lerp(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number,
): number {
  return toMin + ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin);
}


// Sub-index for Dissolved Oxygen (DO), mg/L
// Q_DO = 100 if DO >= 5
// Q_DO = 10 + 90 * (DO-3)/2 if 3 <= DO < 5
// Q_DO = 10 if DO < 3
function calcDOScore(do_ppm: number): number {
  if (do_ppm >= 5) return 100;
  if (do_ppm < 3) return 10;
  return clamp(10 + 90 * ((do_ppm - 3) / 2), 10, 100);
}


// Sub-index for pH
// Q_pH = 100 if 7.5 <= pH <= 8.5
// Q_pH = 10 + 90 * (1 - min(|pH-7.5|, |pH-8.5|)/1.5) if 6.5 < pH < 9.0
// Q_pH = 10 if pH <= 6.5 or pH >= 9.0
function calcPhScore(ph: number): number {
  if (ph >= 7.5 && ph <= 8.5) return 100;
  if (ph <= 6.5 || ph >= 9.0) return 10;
  // 6.5 < pH < 7.5 or 8.5 < pH < 9.0
  const dist = Math.min(Math.abs(ph - 7.5), Math.abs(ph - 8.5));
  return clamp(10 + 90 * (1 - dist / 1.5), 10, 100);
}


// Sub-index for Temperature (°C)
// Q_T = 100 if 28 <= T <= 32
// Q_T = 20 + 80 * (T-25)/10 if 25 <= T < 35
// Q_T = 20 if T < 25 or T > 35
function calcTempScore(tempC: number): number {
  if (tempC >= 28 && tempC <= 32) return 100;
  if (tempC < 25 || tempC > 35) return 20;
  // 25 <= T < 28 or 32 < T <= 35
  return clamp(20 + 80 * ((tempC - 25) / 10), 20, 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
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

  const raw =
    WEIGHTS.do * doScore + WEIGHTS.ph * phScore + WEIGHTS.temp * tempScore;
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


/**
 * Generate insight string based on the worst parameter (DO, pH, or Temp).
 */
export function generateInsights(data: SmartFeederSensorData): string {
  const tempAvg = (data.surfaceTemp + 2 * data.midTemp + data.bottomTemp) / 4;

  const scores = [
    { param: "do" as const, score: calcDOScore(data.dissolvedOxygen) },
    { param: "ph" as const, score: calcPhScore(data.ph) },
    { param: "temp" as const, score: calcTempScore(tempAvg) },
  ];

  const worst = scores.reduce((a, b) => (a.score <= b.score ? a : b));

  switch (worst.param) {
    case "do": {
      const val = data.dissolvedOxygen.toFixed(1);
      if (worst.score >= 80)
        return `Kadar Oksigen Terlarut (DO) berada dalam kondisi baik (${val} ppm). Pertahankan sirkulasi udara yang ada.`;
      if (worst.score < 40)
        return `Kadar Oksigen Terlarut (DO) berada di tingkat kritis (${val} ppm). Segera nyalakan aerator atau kincir air untuk mencegah kematian massal.`;
      return `Kadar Oksigen Terlarut (DO) berada di tingkat waspada (${val} ppm). Nyalakan aerator tambahan dan kurangi pemberian pakan.`;
    }

    case "ph": {
      const val = data.ph.toFixed(1);
      if (worst.score >= 80)
        return `Tingkat pH air berada dalam rentang ideal (${val}). Pertahankan pengelolaan kualitas air yang baik.`;
      if (data.ph < 6.5)
        return `Tingkat pH air terlalu asam (${val}). Tambahkan kapur pertanian (dolomit) untuk menaikkan pH ke rentang 7,5 hingga 8,5.`;
      return `Tingkat pH air terlalu basa (${val}). Lakukan penggantian air sebagian dan periksa sumber air masuk.`;
    }

    case "temp": {
      const val = tempAvg.toFixed(1);
      if (worst.score >= 80)
        return `Suhu rata-rata air berada dalam rentang ideal (${val} C). Pertahankan pengelolaan suhu yang ada.`;
      if (tempAvg < 28)
        return `Suhu rata-rata air terlalu rendah (${val} C). Periksa sistem pemanas dan kurangi debit air masuk dari sumber yang lebih dingin.`;
      return `Suhu rata-rata air terlalu tinggi (${val} C). Tambahkan naungan pada kolam dan tingkatkan sirkulasi air untuk menurunkan suhu.`;
    }
  }
}
/**
 * Utility: Check for temperature stratification (difference between layers).
 * If delta > threshold (e.g. 2°C), flag for aeration.
 */
export function checkStratification(
  surface: number,
  middle: number,
  bottom: number,
  threshold = 2
): boolean {
  const delta12 = Math.abs(surface - middle);
  const delta23 = Math.abs(middle - bottom);
  return delta12 > threshold || delta23 > threshold;
}

export function getTemperatureStatus(tempC: number): WQIStatus {
  if (tempC >= 28 && tempC <= 32) return "safe";
  if (tempC < 25 || tempC > 35) return "critical";
  return "warning";
}

export function getDOStatus(do_ppm: number): WQIStatus {
  if (do_ppm >= 5) return "safe";
  if (do_ppm < 3) return "critical";
  return "warning";
}

export function getPhStatus(ph: number): WQIStatus {
  if (ph >= 7.5 && ph <= 8.5) return "safe";
  if (ph < 6.5 || ph > 9.0) return "critical";
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
  threshold = 2
): { stratified: boolean; message: string; delta12: number; delta23: number } {
  const delta12 = Math.abs(surface - middle);
  const delta23 = Math.abs(middle - bottom);
  const stratified = delta12 > threshold || delta23 > threshold;
  let message = '';
  if (stratified) {
    message = `Stratifikasi suhu terdeteksi!\n\nBeda suhu antar lapisan: permukaan-tengah = ${delta12.toFixed(1)}°C, tengah-dasar = ${delta23.toFixed(1)}°C.\n\nStratifikasi dapat menyebabkan DO rendah di dasar kolam. Segera lakukan aerasi atau pengadukan air.`;
  } else {
    message = `Tidak ada stratifikasi suhu signifikan. Air kolam tercampur baik.`;
  }
  return { stratified, message, delta12, delta23 };
}