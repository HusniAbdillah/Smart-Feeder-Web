"use client";

import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { SmartFeederSensorData } from "@/types";

interface ExportControlsProps {
  data: SmartFeederSensorData[];
}

export function ExportControls({ data }: ExportControlsProps) {
  const handleExportCSV = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = [
      "Waktu",
      "Suhu Permukaan (°C)",
      "Suhu Tengah (°C)",
      "Suhu Dasar (°C)",
      "Oksigen Terlarut (ppm)",
      "pH Air",
      "Kedalaman (m)"
    ];

    // CSV Rows
    const rows = data.map((d) => [
      new Date(d.timestamp).toLocaleString("id-ID"),
      d.surfaceTemp.toString(),
      d.midTemp.toString(),
      d.bottomTemp.toString(),
      d.dissolvedOxygen.toString(),
      d.ph.toString(),
      d.depth.toString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `smart_feeder_data_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={handleExportCSV}
      className="flex items-center gap-2 px-4 py-2 bg-surface text-text-main/80 rounded-xl font-semibold text-sm hover:bg-surface/80 hover:text-text-main transition-colors shadow-sm"
      title="Unduh data sebagai CSV"
    >
      <DownloadSimple size={20} weight="bold" />
      <span>Unduh CSV</span>
    </button>
  );
}
