"use client";

import React from "react";
import { 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Clock, 
  Zap, 
  RotateCcw,
  FileCheck
} from "lucide-react";
import { TaskProgress } from "@/types/media";
import { getApiUrl } from "@/lib/api";

interface ProgressBarProps {
  progressData: TaskProgress | null;
  downloadError: string | null;
  onReset: () => void;
}

export function ProgressBar({ progressData, downloadError, onReset }: ProgressBarProps) {
  if (!progressData && !downloadError) return null;

  const status = progressData?.status || (downloadError ? "failed" : "queued");
  const progressPct = progressData?.progress ?? 0;
  const isCompleted = status === "completed";
  const isFailed = status === "failed" || !!downloadError;

  // Step indicators
  const steps = [
    { id: "queued", label: "Encolado" },
    { id: "downloading", label: "Descargando Stream" },
    { id: "transcoding", label: "Transcodificando FFmpeg" },
    { id: "completed", label: "Listo para Descargar" }
  ];

  const getStepIndex = () => {
    switch (status) {
      case "queued": return 0;
      case "analyzing": return 0;
      case "downloading": return 1;
      case "transcoding": return 2;
      case "completed": return 3;
      default: return 0;
    }
  };

  const currentStepIdx = getStepIndex();

  return (
    <div id="progress-tracker" className="w-full max-w-4xl mx-auto mt-6 glass-panel-glow rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 scroll-mt-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${
            isCompleted 
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
              : isFailed 
              ? "bg-red-500/10 text-red-400 border border-red-500/20"
              : "bg-violet-500/10 text-violet-400 border border-violet-500/20 animate-pulse"
          }`}>
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isFailed ? (
              <AlertCircle className="w-6 h-6" />
            ) : status === "transcoding" ? (
              <Cpu className="w-6 h-6 animate-spin" />
            ) : (
              <Download className="w-6 h-6 animate-bounce" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              {isCompleted ? "¡Procesamiento Completado!" : isFailed ? "Error en el Procesamiento" : "Procesando Multimedia..."}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-0.5">
              {progressData?.message || (downloadError ? downloadError : "Inicializando clúster de conversión...")}
            </p>
          </div>
        </div>

        {/* Live Percentage Badge */}
        {!isFailed && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-cyan-300">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{Math.round(progressPct)}%</span>
          </div>
        )}
      </div>

      {/* Progress Bar Track */}
      <div className="relative w-full h-3.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5 mb-6">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50"
              : isFailed
              ? "bg-red-500"
              : "bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 shadow-lg shadow-cyan-500/40"
          }`}
          style={{ width: `${Math.min(100, Math.max(isFailed ? 100 : 3, progressPct))}%` }}
        />
      </div>

      {/* Step Dots & Labels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {steps.map((st, i) => {
          const isPassed = currentStepIdx >= i && !isFailed;
          const isCurrent = currentStepIdx === i && !isCompleted && !isFailed;

          return (
            <div 
              key={st.id} 
              className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all ${
                isPassed 
                  ? "bg-white/[0.04] border-white/10 text-gray-200" 
                  : "bg-transparent border-transparent text-gray-600"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isPassed 
                  ? "bg-cyan-400 shadow-sm shadow-cyan-400" 
                  : isCurrent 
                  ? "bg-violet-400 animate-ping" 
                  : "bg-gray-700"
              }`} />
              <span className="truncate">{st.label}</span>
            </div>
          );
        })}
      </div>

      {/* Speed & ETA stats */}
      {(progressData?.speed || progressData?.eta) && !isCompleted && !isFailed && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5">
          {progressData.speed && (
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Velocidad: <strong className="text-gray-200">{progressData.speed}</strong></span>
            </div>
          )}
          {progressData.eta && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tiempo Estimado: <strong className="text-gray-200">{progressData.eta}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Completed State Actions */}
      {isCompleted && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/20">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-emerald-300">
            <FileCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-medium truncate max-w-xs sm:max-w-md">
              {progressData?.filename || "Archivo descargado"}
            </span>
            {progressData?.file_size ? (
              <span className="text-gray-400 text-xs">
                ({(progressData.file_size / (1024 * 1024)).toFixed(1)} MB)
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={getApiUrl(`/api/file/${progressData?.id}`)}
              download={progressData?.filename || "download"}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar de nuevo</span>
            </a>
            <button
              type="button"
              onClick={onReset}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
              title="Procesar otro enlace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Failed State Action */}
      {isFailed && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-red-500/[0.06] border border-red-500/20">
          <p className="text-xs text-red-300">
            {downloadError || progressData?.error || "La descarga no pudo completarse. Comprueba el enlace o sube un archivo cookies.txt."}
          </p>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-semibold border border-red-500/30 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </button>
        </div>
      )}
    </div>
  );
}
