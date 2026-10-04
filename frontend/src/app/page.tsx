"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Scissors, 
  AlertCircle 
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { HeroInput } from "@/components/HeroInput";
import { MediaCard } from "@/components/MediaCard";
import { ProgressBar } from "@/components/ProgressBar";
import { SettingsModal } from "@/components/SettingsModal";
import { Footer } from "@/components/Footer";
import { useMediaDownloader } from "@/hooks/useMediaDownloader";

export default function Home() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    url,
    setUrl,
    detectedPlatform,
    isAnalyzing,
    metadata,
    analysisError,
    progressData,
    isDownloading,
    downloadError,
    pasteFromClipboard,
    analyzeUrl,
    startDownload,
    processWatermark,
    autoPasteNotification,
    resetAll
  } = useMediaDownloader();

  return (
    <div className="relative min-h-screen bg-[#090A0F] text-gray-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {/* Dynamic Ambient Background Lights */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ambient-glow absolute top-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="ambient-glow absolute top-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="ambient-glow absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      {/* Navbar */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center pt-28 sm:pt-36 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        {/* Hero Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-semibold text-cyan-300 mb-4 sm:mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>vVideosdownloaderPro v2 • Ultra Fast Engine</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-[1.1] mb-4 sm:mb-5">
            Extracción & Transcodificación <br className="hidden sm:inline" />
            <span className="text-gradient">Universal de Medios</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base md:text-lg text-gray-400 font-normal leading-relaxed max-w-2xl mx-auto px-2">
            Descarga videos en <strong>4K 60fps</strong>, pistas de audio en <strong>320kbps</strong> con portadas ID3 y carruseles sin marcas de agua de YouTube, Instagram, TikTok, X y Facebook.
          </p>
        </div>

        {/* Hero Search Bar Input */}
        <HeroInput
          url={url}
          setUrl={setUrl}
          detectedPlatform={detectedPlatform}
          isAnalyzing={isAnalyzing}
          onAnalyze={analyzeUrl}
          onPaste={pasteFromClipboard}
          autoPasteNotification={autoPasteNotification}
        />

        {/* Analysis Error Alert */}
        {analysisError && (
          <div className="w-full max-w-4xl mx-auto mt-6 p-4 rounded-2xl bg-red-500/[0.08] border border-red-500/20 flex items-start gap-3 text-red-200 text-xs sm:text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-300">No se pudo procesar el enlace</p>
              <p className="mt-0.5 text-gray-300">{analysisError}</p>
              <p className="mt-2 text-xs text-gray-400">
                Sugerencia: Si el contenido es privado o una historia de Instagram, abre el menú <strong>Anti-Bloqueos</strong> en la barra superior para cargar tu archivo <code className="text-cyan-300">cookies.txt</code>.
              </p>
            </div>
          </div>
        )}

        {/* Real-time Progress Bar (SSE tracking) */}
        <ProgressBar
          progressData={progressData}
          downloadError={downloadError}
          onReset={resetAll}
        />

        {/* Media Results Card */}
        {metadata && (
          <MediaCard
            metadata={metadata}
            url={url}
            isDownloading={isDownloading}
            onStartDownload={startDownload}
            onProcessWatermark={processWatermark}
          />
        )}

        {/* Enterprise Features Cards Section (Visible when no active result) */}
        {!metadata && (
          <div className="w-full max-w-5xl mx-auto mt-20 sm:mt-24 space-y-12">
            <div className="text-center">
              <h2 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2">
                Arquitectura de Grado Profesional
              </h2>
              <p className="text-xl sm:text-2xl font-bold text-white">
                Construido para superar los límites de las herramientas tradicionales
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Bypass Anti-Bloqueos
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Rotación automática de User-Agents y soporte nativo para archivo <code className="text-cyan-300 font-mono">cookies.txt</code> de Netscape para sortear bloqueos de Meta y YouTube (errores 403 y CAPTCHA).
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Transcodificación al Vuelo
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Motor FFmpeg acelerado para conversión instantánea entre MP4, WebM, GIF animado y MP3 a 320kbps con normalización sonora e inyección de metadatos ID3.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-panel p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Scissors className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Recorte Rápido y Presets
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Selector de fragmento temporal (Trimming) antes de procesar y presets automáticos para comprimir videos a menos de 25MB para Discord o 16MB para WhatsApp.
                </p>
              </div>
            </div>

            {/* Platform Compatibility List */}
            <div className="glass-panel p-8 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-left">
                <h4 className="text-base font-bold text-white">Soporte Universal Multi-Plataforma</h4>
                <p className="text-xs text-gray-400 mt-1">
                  Extracción optimizada por protocolo para las redes sociales más populares.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {["YouTube 4K & Shorts", "Instagram Reels & Carruseles", "TikTok Sin Marca de Agua", "X / Twitter Videos & GIFs", "Facebook HD", "Pinterest"].map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Settings / Cookies Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
