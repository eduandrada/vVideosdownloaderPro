"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  Film, 
  Music, 
  Image as ImageIcon, 
  Sliders, 
  Scissors, 
  Download, 
  ExternalLink, 
  Check, 
  FileVideo, 
  Disc, 
  Sparkles,
  Zap,
  Layers,
  ChevronDown,
  Wand2,
  Loader2
} from "lucide-react";
import { MediaMetadata, VideoFormat, AudioFormat, DownloadOptions } from "@/types/media";
import { WatermarkSelectorModal } from "@/components/WatermarkSelectorModal";

interface MediaCardProps {
  metadata: MediaMetadata;
  url: string;
  isDownloading: boolean;
  onStartDownload: (options: DownloadOptions) => void;
  onProcessWatermark?: (params: {
    mode: "delogo" | "ai_inpaint";
    box: { x: number; y: number; width: number; height: number };
    startTime?: number;
    endTime?: number;
  }) => void;
}

export function MediaCard({
  metadata,
  url,
  isDownloading,
  onStartDownload,
  onProcessWatermark
}: MediaCardProps) {
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "image">("video");
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState<boolean>(false);
  
  // Selected options
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<VideoFormat | null>(
    metadata.video_formats.length > 0 ? metadata.video_formats[0] : null
  );
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<AudioFormat | null>(
    metadata.audio_formats.length > 0 ? metadata.audio_formats[0] : null
  );
  const [selectedExt, setSelectedExt] = useState<string>("mp4");
  const [selectedPreset, setSelectedPreset] = useState<string>("none");

  // Trimming states
  const totalDuration = metadata.duration || 60;
  const [enableTrim, setEnableTrim] = useState<boolean>(false);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number>(Math.min(totalDuration, 300));

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleDownload = (mode: "video" | "audio" | "image", formatId?: string) => {
    const options: DownloadOptions = {
      url: url,
      mode: mode,
      title: metadata.title,
      trim_start: enableTrim ? trimStart : undefined,
      trim_end: enableTrim ? trimEnd : undefined
    };

    if (mode === "video") {
      options.format_id = formatId || selectedVideoFormat?.format_id;
      options.output_format = selectedExt;
      if (selectedPreset !== "none") {
        options.preset = selectedPreset;
      }
    } else if (mode === "audio") {
      options.output_format = selectedAudioFormat?.ext || "mp3";
      options.bitrate = selectedAudioFormat?.bitrate || "320k";
    }

    onStartDownload(options);

    // Smooth scroll to progress bar
    setTimeout(() => {
      const el = document.getElementById("progress-tracker");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 glass-panel rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-300">
      {/* Top Preview Banner */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 p-4 sm:p-8 bg-gradient-to-b from-white/[0.04] to-transparent border-b border-white/5">
        {/* Thumbnail Preview */}
        <div className="relative w-full md:w-80 h-44 sm:h-52 rounded-2xl overflow-hidden bg-black/60 border border-white/10 flex-shrink-0 group shadow-lg">
          {metadata.thumbnail ? (
            <img
              src={metadata.thumbnail}
              alt={metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600">
              <Film className="w-12 h-12" />
            </div>
          )}

          {/* Duration Badge */}
          {metadata.duration > 0 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-semibold text-white tracking-wider">
              {metadata.duration_formatted}
            </div>
          )}

          {/* Platform Badge */}
          <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-bold" style={{ color: metadata.platform.hex_color }}>
            {metadata.platform.name}
          </div>
        </div>

        {/* Info & Details */}
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight line-clamp-2 hover:text-cyan-300 transition-colors">
              {metadata.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 sm:mt-3 text-xs sm:text-sm text-gray-400">
              <span className="font-medium text-gray-300">
                Por: <strong className="text-white">{metadata.uploader}</strong>
              </span>
              {metadata.view_count && (
                <>
                  <span>•</span>
                  <span>{metadata.view_count.toLocaleString()} vistas</span>
                </>
              )}
              {metadata.upload_date && (
                <>
                  <span>•</span>
                  <span>Fecha: {metadata.upload_date}</span>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats Tags */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[11px] sm:text-xs font-semibold text-violet-300">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              {metadata.video_formats.length} Calidades
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] sm:text-xs font-semibold text-cyan-300">
              <Disc className="w-3.5 h-3.5 text-cyan-400" />
              Audio HD 320kbps
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-8 pt-3 sm:pt-4 border-b border-white/5 bg-black/20 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("video")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === "video"
              ? "text-cyan-400 border-cyan-400 bg-white/[0.04]"
              : "text-gray-400 border-transparent hover:text-white hover:bg-white/[0.02]"
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Video ({metadata.video_formats.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audio")}
          className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap flex-shrink-0 ${
            activeTab === "audio"
              ? "text-violet-400 border-violet-400 bg-white/[0.04]"
              : "text-gray-400 border-transparent hover:text-white hover:bg-white/[0.02]"
          }`}
        >
          <Music className="w-4 h-4" />
          <span>Audio ({metadata.audio_formats.length})</span>
        </button>

        {metadata.image_formats.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-3 sm:px-4 rounded-t-xl text-xs sm:text-sm font-semibold transition border-b-2 whitespace-nowrap flex-shrink-0 ${
              activeTab === "image"
                ? "text-pink-400 border-pink-400 bg-white/[0.04]"
                : "text-gray-400 border-transparent hover:text-white hover:bg-white/[0.02]"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imágenes ({metadata.image_formats.length})</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div className="p-4 sm:p-8">
        {/* VIDEO TAB */}
        {activeTab === "video" && (
          <div className="space-y-6">
            {/* Resolution Selector Grid */}
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 block">
                Selecciona la Calidad de Video
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {metadata.video_formats.map((fmt, i) => {
                  const isSelected = selectedVideoFormat?.format_id === fmt.format_id;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedVideoFormat(fmt)}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border-cyan-400/80 shadow-lg shadow-cyan-500/10"
                          : "bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {fmt.quality_label}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-cyan-400 flex items-center justify-center">
                            <Check className="w-3 h-3 text-black stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span className="uppercase px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px]">
                          {fmt.ext}
                        </span>
                        {fmt.size_mb ? (
                          <span>~{fmt.size_mb} MB</span>
                        ) : (
                          <span>Dinámico</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Tools & Compression Presets */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Format selection */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium">Contenedor:</span>
                  <div className="flex items-center gap-1.5">
                    {["mp4", "webm", "gif"].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setSelectedExt(fmt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                          selectedExt === fmt
                            ? "bg-cyan-500/20 border border-cyan-400 text-cyan-300"
                            : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Compression */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-medium">Compresión:</span>
                  <select
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="bg-black/60 border border-white/10 text-xs rounded-xl px-3 py-1.5 text-gray-200 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="none">Calidad Máxima (Sin límite)</option>
                    <option value="discord_25mb">Discord (&lt; 25 MB)</option>
                    <option value="whatsapp_16mb">WhatsApp (&lt; 16 MB)</option>
                  </select>
                </div>
              </div>

              {/* Trimming Toggle & Range */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setEnableTrim(!enableTrim)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white"
                  >
                    <Scissors className={`w-3.5 h-3.5 ${enableTrim ? "text-cyan-400" : "text-gray-500"}`} />
                    <span>Recortar fragmento de video</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                      {enableTrim ? "Activado" : "Opcional"}
                    </span>
                  </button>

                  {enableTrim && (
                    <div className="text-xs text-cyan-300 font-mono">
                      {formatSeconds(trimStart)} - {formatSeconds(trimEnd)} (Duración: {formatSeconds(trimEnd - trimStart)})
                    </div>
                  )}
                </div>

                {enableTrim && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Segundo Inicial (Inicio)</label>
                      <input
                        type="range"
                        min={0}
                        max={Math.max(0, trimEnd - 1)}
                        value={trimStart}
                        onChange={(e) => setTrimStart(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-1">Segundo Final (Fin)</label>
                      <input
                        type="range"
                        min={Math.min(totalDuration, trimStart + 1)}
                        max={totalDuration}
                        value={trimEnd}
                        onChange={(e) => setTrimEnd(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Download Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDownloading || !selectedVideoFormat}
                onClick={() => handleDownload("video")}
                className="w-full sm:flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm tracking-wide shadow-xl shadow-violet-600/30 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>Procesando descarga...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>
                      Descargar Video {selectedVideoFormat ? `(${selectedVideoFormat.quality_label} .${selectedExt})` : ""}
                    </span>
                  </>
                )}
              </button>

              {/* Watermark Remover Button */}
              {onProcessWatermark && (
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={() => setIsWatermarkModalOpen(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:text-white transition shadow-lg shadow-cyan-500/10 active:scale-95 disabled:opacity-50"
                  title="Abrir editor para eliminar marcas de agua o logos con FFmpeg o IA"
                >
                  <Wand2 className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Eliminar Marca de Agua</span>
                </button>
              )}

              {/* Direct Link button if available */}
              {selectedVideoFormat?.url && (
                <a
                  href={selectedVideoFormat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-300 hover:text-white transition"
                  title="Abrir stream directo en el navegador sin pasar por el servidor"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-400" />
                  <span>Stream Directo</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* AUDIO TAB */}
        {activeTab === "audio" && (
          <div className="space-y-6">
            <div>
              <label className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3 block">
                Selecciona la Calidad de Audio (Con Metadatos e Ilustración)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {metadata.audio_formats.map((afmt, i) => {
                  const isSelected = selectedAudioFormat?.label === afmt.label;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAudioFormat(afmt)}
                      className={`flex flex-col text-left p-4 rounded-2xl border transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-br from-violet-600/20 to-purple-500/20 border-violet-400/80 shadow-lg shadow-violet-500/10"
                          : "bg-white/[0.02] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white">
                          {afmt.label}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-violet-400 flex items-center justify-center">
                            <Check className="w-3 h-3 text-black stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <span className="uppercase px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px]">
                          {afmt.ext}
                        </span>
                        {afmt.size_mb ? (
                          <span>~{afmt.size_mb} MB</span>
                        ) : (
                          <span>Estimado</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Audio Perks Callout */}
            <div className="p-4 rounded-2xl bg-violet-500/[0.05] border border-violet-500/20 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-violet-400 flex-shrink-0" />
              <p className="text-xs text-violet-200 leading-relaxed">
                OmniPull normaliza automáticamente el volumen de audio con FFmpeg e inyecta la portada HD, el nombre del artista ({metadata.uploader}) y el título en las etiquetas ID3 del archivo.
              </p>
            </div>

            {/* Trimming for Audio */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setEnableTrim(!enableTrim)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white"
                >
                  <Scissors className={`w-3.5 h-3.5 ${enableTrim ? "text-violet-400" : "text-gray-500"}`} />
                  <span>Extraer solo fragmento / ringtone</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                    {enableTrim ? "Activado" : "Opcional"}
                  </span>
                </button>
                {enableTrim && (
                  <div className="text-xs text-violet-300 font-mono">
                    {formatSeconds(trimStart)} - {formatSeconds(trimEnd)}
                  </div>
                )}
              </div>

              {enableTrim && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Inicio de Audio</label>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, trimEnd - 1)}
                      value={trimStart}
                      onChange={(e) => setTrimStart(Number(e.target.value))}
                      className="w-full accent-violet-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Fin de Audio</label>
                    <input
                      type="range"
                      min={Math.min(totalDuration, trimStart + 1)}
                      max={totalDuration}
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(Number(e.target.value))}
                      className="w-full accent-violet-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              type="button"
              disabled={isDownloading || !selectedAudioFormat}
              onClick={() => handleDownload("audio")}
              className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-violet-600/30 active:scale-95 transition-all duration-200 disabled:opacity-60 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Extrayendo audio...</span>
                </>
              ) : (
                <>
                  <Music className="w-5 h-5" />
                  <span>
                    Extraer Audio ({selectedAudioFormat?.label})
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* IMAGES TAB */}
        {activeTab === "image" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {metadata.image_formats.map((img, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-black/40 border border-white/10 group">
                  <div className="relative h-44 w-full overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-3.5 flex items-center justify-between bg-white/[0.02]">
                    <span className="text-xs font-semibold text-gray-200 truncate">
                      {img.label}
                    </span>
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-medium border border-pink-500/30 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Watermark Selector Modal */}
      {onProcessWatermark && (
        <WatermarkSelectorModal
          isOpen={isWatermarkModalOpen}
          onClose={() => setIsWatermarkModalOpen(false)}
          metadata={metadata}
          url={url}
          onProcessWatermark={onProcessWatermark}
        />
      )}
    </div>
  );
}
