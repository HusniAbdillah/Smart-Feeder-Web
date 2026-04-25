"use client";

import { useEffect, useState } from "react";
import { CloudSlash } from "@phosphor-icons/react/dist/ssr/CloudSlash";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20">
        <CloudSlash size={24} weight="bold" />
        <span className="font-bold text-sm">Mode Offline: Data tidak terbarui</span>
      </div>
    </div>
  );
}
