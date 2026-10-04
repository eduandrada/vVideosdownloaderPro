"use client";

import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface NavbarProps {
  onOpenSettings: () => void;
}

export function Navbar({ onOpenSettings }: NavbarProps) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const checkHealth = () => {
      apiFetch<{ status: string }>("/api/health")
        .then((d) => setIsLive(d.status === "online"))
        .catch(() => setIsLive(false));
    };
    checkHealth();
    const timer = setInterval(checkHealth, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full fixed top-0 left-0 z-40 px-3 sm:px-8 py-3 sm:py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-panel rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 border border-white/10 shadow-lg">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/30 flex-shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-base sm:text-xl tracking-tight text-white whitespace-nowrap">
                vVideos<span className="text-gradient">downloaderPro</span>
              </span>
              <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-cyan-300 border border-violet-500/30 text-[10px] font-bold tracking-widest uppercase">
                v2
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-gray-300">
            <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-amber-400"}`} />
            <span>{isLive ? "Motor Activo" : "Conectando..."}</span>
          </div>

          {/* Engine Settings / Cookies Modal */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition shadow-sm active:scale-95"
            title="Ajustes Anti-Bloqueos & Cookies"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-[11px] sm:text-xs">Anti-Bloqueos</span>
          </button>
        </div>
      </div>
    </header>
  );
}
