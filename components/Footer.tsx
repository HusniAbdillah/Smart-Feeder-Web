"use client";

import Image from "next/image";
import logoIpb from "../app/logo-ipb.png";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-text-main/8 pt-6 sm:pt-8">
      <div className="flex flex-col gap-5 rounded-3xl bg-surface p-5 shadow-sm sm:p-6 md:flex-row md:items-end md:justify-between">
        <Image
          src={logoIpb}
          alt="Logo IPB University"
          width={320}
          height={120}
          sizes="(max-width: 768px) 220px, 320px"
          className="h-14 w-auto max-w-full object-contain md:h-16 md:self-end md:order-first"
          priority={false}
        />

        <div className="space-y-1 text-left md:text-right">
          <p className="text-sm sm:text-base font-bold text-text-main">
            Divisi Akustik, Instrumentasi & Robotika Kelautan
          </p>
          <p className="text-xs sm:text-sm text-text-main/60">
            Departemen Ilmu dan Teknologi Kelautan · FPIK · IPB University
          </p>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-text-main/45">
            smart-feeder · Copyright © 2026
          </p>
        </div>
      </div>
    </footer>
  );
}