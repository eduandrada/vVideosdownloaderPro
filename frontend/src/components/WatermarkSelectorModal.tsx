"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Sparkles, 
  Cpu, 
  Zap, 
  Clock, 
  Sliders, 
  Scissors, 
  CheckCircle2, 
  AlertTriangle,
  Move,
  Maximize2,
  Layers,
  Wand2
} from "lucide-react";
import { MediaMetadata } from "@/types/media";

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pct_x?: number;
  pct_y?: number;
  pct_w?: number;
  pct_h?: number;
}

interface WatermarkSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: MediaMetadata;
  url: string;
  onProcessWatermark: (params: {
    mode: "delogo" | "ai_inpaint";
    box: BoundingBox;
    startTime?: number;
    endTime?: number;
  }) => void;
}

export function WatermarkSelectorModal({
  isOpen,
  onClose,
  metadata,
  url,
  onProcessWatermark
}: WatermarkSelectorModalProps) {
  // Method: "delogo" (Express) vs "ai_inpaint" (Neural ProPainter)
  const [method, setMethod] = useState<"delogo" | "ai_inpaint">("delogo");
  
  // Video container & Preview dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 360 });

  // Bounding box in percentage (0-100) for responsive drag & drop
  const [boxPct, setBoxPct] = useState({ x: 70, y: 5, w: 25, h: 15 }); // default top right corner

  // Dragging and resizing states
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, boxX: 0, boxY: 0, boxW: 0, boxH: 0 });

  // Timeline for watermark appearance
  const totalDuration = metadata.duration || 60;
  const [enableTimeline, setEnableTimeline] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(totalDuration);

  // Live preview toggle
  const [showPreviewBlur, setShowPreviewBlur] = useState(true);

  // Update container size on mount / resize
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Format time MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Convert percentage to actual pixels (based on typical video 1920x1080 or 1080x1920)
  const isVertical = metadata.thumbnail ? false : false; // standard HD default
  const baseVideoWidth = 1920;
  const baseVideoHeight = 1080;

  const actualBoxPixels: BoundingBox = {
    x: Math.round((boxPct.x / 100) * baseVideoWidth),
    y: Math.round((boxPct.y / 100) * baseVideoHeight),
    width: Math.round((boxPct.w / 100) * baseVideoWidth),
    height: Math.round((boxPct.h / 100) * baseVideoHeight),
    pct_x: boxPct.x,
    pct_y: boxPct.y,
    pct_w: boxPct.w,
    pct_h: boxPct.h,
  };

  // Drag handlers
  const handleMouseDownDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: boxPct.x,
      boxY: boxPct.y,
      boxW: boxPct.w,
      boxH: boxPct.h,
    };
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: boxPct.x,
      boxY: boxPct.y,
      boxW: boxPct.w,
      boxH: boxPct.h,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      const deltaX = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100 - boxPct.w, dragStartRef.current.boxX + deltaX));
      const newY = Math.max(0, Math.min(100 - boxPct.h, dragStartRef.current.boxY + deltaY));

      setBoxPct((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
    } else if (isResizing) {
      const deltaW = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const deltaH = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

      const newW = Math.max(5, Math.min(100 - boxPct.x, dragStartRef.current.boxW + deltaW));
      const newH = Math.max(5, Math.min(100 - boxPct.y, dragStartRef.current.boxH + deltaH));

      setBoxPct((prev) => ({ ...prev, w: Math.round(newW), h: Math.round(newH) }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  // Presets
  const applyPreset = (preset: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "tiktok-float") => {
    switch (preset) {
      case "top-right":
        setBoxPct({ x: 72, y: 5, w: 24, h: 14 });
        break;
      case "top-left":
        setBoxPct({ x: 4, y: 5, w: 24, h: 14 });
        break;
      case "bottom-right":
        setBoxPct({ x: 72, y: 80, w: 24, h: 14 });
        break;
      case "bottom-left":
        setBoxPct({ x: 4, y: 80, w: 24, h: 14 });
        break;
      case "tiktok-float":
        setBoxPct({ x: 68, y: 15, w: 28, h: 12 });
        break;
    }
  };

  const handleSubmit = () => {
    onProcessWatermark({
      mode: method,
      box: actualBoxPixels,
      startTime: enableTimeline ? startTime : undefined,
      endTime: enableTimeline ? endTime : undefined,
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="w-full max-w-4xl glass-panel-glow rounded-3xl p-5 sm:p-8 border border-white/10 relative max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wand2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-wide">
                  Eliminador de Marcas de Agua
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase">
                  Nivel 2 & 3
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Arrastra y redimensiona el recuadro sobre el logotipo o texto a borrar.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Canvas Player with Draggable Bounding Box */}
        <div className="flex flex-col items-center">
          <div
            ref={containerRef}
            className="relative w-full aspect-video max-h-[380px] rounded-2xl overflow-hidden bg-black/80 border border-white/15 shadow-2xl flex items-center justify-center group"
          >
            {/* Background Thumbnail preview */}
            {metadata.thumbnail ? (
              <img
                src={metadata.thumbnail}
                alt="Frame preview"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <div className="text-gray-500 text-xs">Sin vista previa disponible</div>
            )}

            {/* Simulated Live Delogo Blur Effect inside Bounding Box */}
            {showPreviewBlur && (
              <div
                className="absolute pointer-events-none backdrop-blur-md bg-white/5 border border-cyan-400/30 transition-all rounded-md"
                style={{
                  left: `${boxPct.x}%`,
                  top: `${boxPct.y}%`,
                  width: `${boxPct.w}%`,
                  height: `${boxPct.h}%`,
                }}
              />
            )}

            {/* Draggable & Resizable Selection Box */}
            <div
              onMouseDown={handleMouseDownDrag}
              className={`absolute cursor-move border-2 ${
                method === "ai_inpaint" 
                  ? "border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-500/30" 
                  : "border-cyan-400 bg-cyan-500/20 shadow-lg shadow-cyan-500/30"
              } rounded-md transition-shadow group-hover:opacity-100 flex items-center justify-center`}
              style={{
                left: `${boxPct.x}%`,
                top: `${boxPct.y}%`,
                width: `${boxPct.w}%`,
                height: `${boxPct.h}%`,
              }}
            >
              {/* Center icon / Coordinates */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-white font-mono pointer-events-none">
                <Move className="w-3 h-3 text-cyan-300" />
                <span>{actualBoxPixels.width}x{actualBoxPixels.height}px</span>
              </div>

              {/* Resize Handle on Bottom-Right */}
              <div
                onMouseDown={handleMouseDownResize}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white rounded-full border-2 border-cyan-500 cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                title="Arrastra para redimensionar"
              />
            </div>

            {/* Overlay hint */}
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Arrastra el recuadro o usa los presets inferiores</span>
            </div>
          </div>

          {/* Quick Corner Presets */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            <span className="text-xs text-gray-400 font-medium">Presets rápidos:</span>
            <button
              type="button"
              onClick={() => applyPreset("top-right")}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white"
            >
              Superior Der.
            </button>
            <button
              type="button"
              onClick={() => applyPreset("top-left")}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white"
            >
              Superior Izq.
            </button>
            <button
              type="button"
              onClick={() => applyPreset("bottom-right")}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white"
            >
              Inferior Der.
            </button>
            <button
              type="button"
              onClick={() => applyPreset("bottom-left")}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white"
            >
              Inferior Izq.
            </button>
            <button
              type="button"
              onClick={() => applyPreset("tiktok-float")}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-xs text-cyan-300"
            >
              Flotante TikTok
            </button>
          </div>
        </div>

        {/* Processing Method Selector (Express vs AI Neural) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Method 1: Express FFmpeg */}
          <div
            onClick={() => setMethod("delogo")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
              method === "delogo"
                ? "bg-cyan-500/10 border-cyan-400 shadow-lg shadow-cyan-500/10"
                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">Modo Express (FFmpeg Delogo)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ultrarrápido (2-5s)
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Interpola píxeles circundantes de forma algorítmica sin coste de GPU. Ideal para logotipos de canales y esquinas fijas.
            </p>
          </div>

          {/* Method 2: AI Neural ProPainter */}
          <div
            onClick={() => setMethod("ai_inpaint")}
            className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
              method === "ai_inpaint"
                ? "bg-violet-500/10 border-violet-400 shadow-lg shadow-violet-500/10"
                : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <h4 className="text-sm font-bold text-white">Modo IA Neural (ProPainter Inpainting)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Ultra Premium
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Reconstrucción espaciotemporal frame a frame guiada por flujo óptico. Elimina marcas de agua flotantes o semitransparentes sin parpadeo.
            </p>
          </div>
        </div>

        {/* Timeline Trimming for Watermarks that only appear at start/end */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEnableTimeline(!enableTimeline)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white"
            >
              <Scissors className={`w-3.5 h-3.5 ${enableTimeline ? "text-cyan-400" : "text-gray-500"}`} />
              <span>Aplicar solo durante un intervalo temporal</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                {enableTimeline ? "Activado" : "Todo el video"}
              </span>
            </button>
            {enableTimeline && (
              <span className="text-xs font-mono text-cyan-300">
                {formatTime(startTime)} - {formatTime(endTime)}
              </span>
            )}
          </div>

          {enableTimeline && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Segundo de Inicio</label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, endTime - 1)}
                  value={startTime}
                  onChange={(e) => setStartTime(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Segundo de Fin</label>
                <input
                  type="range"
                  min={Math.min(totalDuration, startTime + 1)}
                  max={totalDuration}
                  value={endTime}
                  onChange={(e) => setEndTime(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
          <div className="text-xs text-gray-400">
            Región seleccionada: <strong className="text-white font-mono">{actualBoxPixels.width}x{actualBoxPixels.height}px</strong> en <span className="font-mono">({actualBoxPixels.x}, {actualBoxPixels.y})</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold border border-white/10 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-xs shadow-lg transition active:scale-95 ${
                method === "ai_inpaint"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-violet-600/30"
                  : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 shadow-cyan-500/30"
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>
                {method === "ai_inpaint" ? "Iniciar Inpainting Neuronal" : "Eliminar con FFmpeg Express"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
