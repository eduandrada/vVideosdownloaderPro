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
          className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 opacity-25 blur-xl group-hover:opacity-50 transition duration-500"
        />

        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center glass-panel-glow rounded-3xl p-2 sm:p-2.5 transition-all duration-300 gap-2 sm:gap-1.5 border border-white/10 shadow-2xl">
          {/* Main Input Row */}
          <div className="flex items-center flex-1 min-w-0">
            {/* Platform Icon Badge */}
            <div className="flex items-center pl-2 sm:pl-3 pr-1 py-1 text-gray-400 flex-shrink-0">
              {detectedPlatform ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold tracking-wide">
                  {getPlatformIcon(detectedPlatform.id)}
                  <span className="text-xs font-semibold hidden xs:inline" style={{ color: detectedPlatform.hex_color }}>
                    {detectedPlatform.name}
                  </span>
                </div>
              ) : (
                <Search className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              )}
            </div>

            {/* Input Element with 16px font to prevent iOS/Android zoom */}
            <input
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handleNativePaste}
              placeholder="Pega el enlace de video o audio..."
              className="w-full min-w-0 bg-transparent border-none text-white placeholder-gray-500 font-normal px-2.5 py-3 focus:outline-none focus:ring-0 selection:bg-violet-500 selection:text-white"
              style={{ fontSize: "16px" }}
            />

            {/* Clear Button */}
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
                title="Borrar enlace"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Smart Paste Button */}
            <button
              type="button"
              onClick={handleSmartPaste}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/20 border border-white/10 text-xs font-semibold text-gray-200 hover:text-white transition active:scale-95 flex-shrink-0 min-h-[42px]"
              title="Pegar desde el portapapeles"
            >
              {copiedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">¡Pegado!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4 text-cyan-400" />
                  <span>Pegar</span>
                </>
              )}
            </button>
          </div>

          {/* Action Button: Full width on mobile for thumb, inline on desktop */}
          <button
            type="button"
            disabled={isAnalyzing || !url.trim()}
            onClick={() => onAnalyze()}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 sm:py-3 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm tracking-wide shadow-lg shadow-violet-600/30 active:scale-[0.98] transition-all min-h-[48px] flex-shrink-0"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Analizando...</span>
              </>
            ) : (
              <>
                <span>Extraer</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auto-detect info pill */}
      <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-gray-400 font-medium px-2 text-center">
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Detección inteligente activa:</span>
        <span className="text-cyan-400 font-semibold">Copia cualquier enlace y pulsa "Pegar"</span>
      </div>

      {/* Quick Example Suggestions */}
      <div className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 px-2">
        <span className="text-xs text-gray-500 font-medium mr-1">Probar con:</span>
        {exampleLinks.map((ex, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(ex.url);
              onAnalyze(ex.url);
            }}
            className="text-[11px] sm:text-xs px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] active:bg-white/15 border border-white/5 text-gray-300 hover:text-cyan-300 transition active:scale-95"
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
