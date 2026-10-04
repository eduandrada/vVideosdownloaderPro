"use client";

import React, { useState } from "react";
import { 
  Search, 
  Clipboard, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  X
} from "lucide-react";
import { 
  YoutubeIcon, 
  InstagramIcon, 
  TikTokIcon, 
  TwitterXIcon, 
  FacebookIcon, 
  PinterestIcon 
} from "@/components/BrandIcons";
import { PlatformInfo } from "@/types/media";

interface HeroInputProps {
  url: string;
  setUrl: (url: string) => void;
  detectedPlatform: PlatformInfo | null;
  isAnalyzing: boolean;
  onAnalyze: (targetUrl?: string) => void;
  onPaste: () => Promise<string | null>;
  autoPasteNotification?: string | null;
}

export function HeroInput({
  url,
  setUrl,
  detectedPlatform,
  isAnalyzing,
  onAnalyze,
  onPaste,
  autoPasteNotification
}: HeroInputProps) {
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url.trim()) {
      onAnalyze();
    }
  };

  const handleNativePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
      setUrl(text.trim());
      onAnalyze(text.trim());
    }
  };

  const handleSmartPaste = async () => {
    const pasted = await onPaste();
    if (pasted) {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
      onAnalyze(pasted);
    }
  };

  const getPlatformIcon = (id?: string) => {
    switch (id) {
      case "youtube":
        return <YoutubeIcon className="w-5 h-5 text-red-500 animate-pulse" />;
      case "instagram":
        return <InstagramIcon className="w-5 h-5 text-pink-500 animate-pulse" />;
      case "tiktok":
        return <TikTokIcon className="w-5 h-5 text-cyan-400 animate-pulse" />;
      case "twitter":
        return <TwitterXIcon className="w-4 h-4 text-sky-400 animate-pulse" />;
      case "facebook":
        return <FacebookIcon className="w-5 h-5 text-blue-500 animate-pulse" />;
      case "pinterest":
        return <PinterestIcon className="w-5 h-5 text-rose-500 animate-pulse" />;
      default:
        return <Sparkles className="w-5 h-5 text-violet-400" />;
    }
  };

  const exampleLinks = [
    { label: "YouTube 4K / Music", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { label: "Instagram Reel", url: "https://www.instagram.com/reel/example" },
    { label: "TikTok Clip", url: "https://www.tiktok.com/@example/video/123456" },
    { label: "X / Twitter", url: "https://x.com/SpaceX/status/12345" }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* Auto Paste Toast Banner */}
      {autoPasteNotification && (
        <div className="mb-3.5 w-full max-w-xl transition-all duration-300 animate-bounce">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600/30 via-indigo-600/30 to-cyan-500/30 border border-violet-400/40 text-violet-200 text-xs backdrop-blur-xl shadow-xl shadow-violet-950/40">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
              <div className="truncate">
                <span className="font-bold text-white tracking-wide">¡Enlace copiado detectado!</span>
                <span className="text-gray-300 font-mono text-[11px] truncate block max-w-sm">{autoPasteNotification}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 font-medium text-[10px] tracking-wider uppercase flex-shrink-0 border border-cyan-400/30">
              <Loader2 className="w-3 h-3 animate-spin text-cyan-300" />
              <span>Extrayendo</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Input Container */}
      <div className="relative w-full group">
        {/* Ambient Gradient Glow Background */}
        <div 
          className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 opacity-30 blur-xl group-hover:opacity-60 transition duration-500 group-focus-within:opacity-75"
        />

        <div className="relative flex items-center glass-panel-glow rounded-2xl p-1.5 sm:p-2.5 transition-all duration-300">
          {/* Platform Icon Badge */}
          <div className="flex items-center pl-2 sm:pl-3 pr-1 sm:pr-2 py-1 text-gray-400">
            {detectedPlatform ? (
              <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold tracking-wide">
                {getPlatformIcon(detectedPlatform.id)}
                <span className="hidden sm:inline" style={{ color: detectedPlatform.hex_color }}>
                  {detectedPlatform.name}
                </span>
              </div>
            ) : (
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
            )}
          </div>

          {/* Main Hero Input */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handleNativePaste}
            onFocus={async () => {
              if (!url) {
                await onPaste();
              }
            }}
            placeholder="Pega enlace de YouTube, TikTok, Insta..."
            className="w-full min-w-0 bg-transparent border-none text-white placeholder-gray-500 text-xs sm:text-base font-normal px-2 py-2.5 sm:py-3 focus:outline-none focus:ring-0 selection:bg-violet-500 selection:text-white"
          />

          {/* Action Buttons inside Input */}
          <div className="flex items-center gap-1 sm:gap-2 pr-1 flex-shrink-0">
            {/* Clear Button if text present */}
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
                title="Limpiar"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Smart Paste Button */}
            <button
              type="button"
              onClick={handleSmartPaste}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-gray-300 hover:text-white transition active:scale-95 shadow-sm min-h-[38px] sm:min-h-[44px]"
              title="Pegar desde el portapapeles"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline text-emerald-400">¡Pegado!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden md:inline">Paste</span>
                </>
              )}
            </button>

            {/* Submit / Analyze Button */}
            <button
              type="button"
              disabled={isAnalyzing || !url.trim()}
              onClick={() => onAnalyze()}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-violet-600/30 active:scale-95 transition-all duration-200 min-h-[38px] sm:min-h-[44px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Analizando...</span>
                </>
              ) : (
                <>
                  <span>Extraer</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-detect info pill */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-gray-500 font-medium">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-gray-400">Detección automática activa:</span>
        <span className="text-cyan-400/80 hidden sm:inline">Copia cualquier enlace o presiona Ctrl+V para analizar sin hacer clic</span>
        <span className="text-cyan-400/80 sm:hidden">Copia un link o pega con Ctrl+V</span>
      </div>

      {/* Quick Example Suggestions */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 mt-3 px-2">
        <span className="text-xs text-gray-500 font-medium">Ejemplos rápidos:</span>
        {exampleLinks.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(ex.url);
              onAnalyze(ex.url);
            }}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-gray-400 hover:text-cyan-300 transition-colors"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
