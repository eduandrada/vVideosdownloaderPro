import React from "react";
import { Shield, Cpu } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full mt-24 border-t border-white/5 py-12 px-4 sm:px-8 text-center text-xs text-gray-500 bg-black/40">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
          <span className="font-bold text-gray-300 tracking-wide">
            vVideosdownloaderPro v2 © {new Date().getFullYear()}
          </span>
          <span className="hidden sm:inline text-gray-700">•</span>
          <span className="text-gray-400">
            Desarrollado por <strong className="text-cyan-400 font-semibold">Eduardo Andrada</strong> / Catamarca / FastAPI, yt-dlp, FFmpeg & Next.js
          </span>
        </div>

        <div className="flex items-center gap-4 text-gray-400 text-xs">
          <span className="flex items-center gap-1.5 hover:text-cyan-400 transition">
            <Cpu className="w-3.5 h-3.5" /> Aceleración Hardware
          </span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-1.5 hover:text-emerald-400 transition">
            <Shield className="w-3.5 h-3.5" /> Anti-Bloqueos
          </span>
        </div>
      </div>
    </footer>
  );
}
