import type { ReactNode } from "react";
import Image from "next/image";

import logoImg from "../app/logo.png";

interface HeaderProps {
  updatedAt: string;
  actions?: ReactNode;
}

export function Header({ updatedAt, actions }: HeaderProps) {
  return (
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
          <p className="mt-2 text-xs md:text-sm font-bold text-text-main/65">
            Divisi Akustik, Instrumentasi & Robotika Kelautan
          </p>
          <p className="text-[11px] md:text-sm text-text-main/55">
            Departemen Ilmu dan Teknologi Kelautan · FPIK · IPB University
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center md:items-end gap-3 pt-2">
        <div className="text-[11px] md:text-sm font-bold uppercase tracking-wider text-text-main/60 whitespace-nowrap bg-surface px-3 py-1.5 rounded-full border border-text-main/5 shadow-sm">
          Terakhir Diperbarui: {updatedAt}
        </div>
        {actions}
      </div>
    </header>
  );
}