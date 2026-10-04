"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  ShieldCheck, 
  UploadCloud, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Cpu, 
  Globe
} from "lucide-react";
import { apiFetch, getApiBaseUrl, setCustomApiUrl, getCustomApiUrl } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [health, setHealth] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [apiUrlInput, setApiUrlInput] = useState<string>("");
  const [saveUrlSuccess, setSaveUrlSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiUrlInput(getCustomApiUrl() || getApiBaseUrl());
      checkHealth();
    }
  }, [isOpen]);

  const checkHealth = () => {
    apiFetch("/api/health")
      .then((data) => setHealth(data))
      .catch(() => setHealth({ status: "offline" }));
  };

  const handleSaveApiUrl = () => {
    setCustomApiUrl(apiUrlInput.trim());
    setSaveUrlSuccess(true);
    setTimeout(() => setSaveUrlSuccess(false), 2500);
    checkHealth();
  };

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await apiFetch("/api/cookies", {
        method: "POST",
        body: formData
      });
      setUploadStatus("¡Archivo cookies.txt importado con éxito!");
      apiFetch("/api/health").then(setHealth).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con la API.";
      setUploadStatus(`Error: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/10 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Configuración vVideosdownloaderPro v2</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Gestión de Anti-bloqueos, Cookies de Sesión y Estado del Servidor
            </p>
          </div>
        </div>

        {/* Backend API Connection Box */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>Conexión con el Servidor Backend</span>
            </h4>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              health?.status === "online" 
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}>
              {health?.status === "online" ? "● Conectado" : "○ Sin conexión"}
            </span>
          </div>

          <p className="text-[11px] text-gray-400">
            Ingresa la URL de tu API en Render (ej. <code className="text-cyan-300">https://vvideosdownloaderpro-api.onrender.com</code>):
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={apiUrlInput}
              onChange={(e) => setApiUrlInput(e.target.value)}
              placeholder="https://vvideosdownloaderpro-api.onrender.com"
              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/60 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveApiUrl}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition active:scale-95 flex-shrink-0"
            >
              {saveUrlSuccess ? "¡Guardado!" : "Guardar & Probar"}
            </button>
          </div>
        </div>

        {/* System Health Section */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 mb-6">
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Diagnóstico del Sistema</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-gray-500 block">Backend API:</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-1">
                <span className={`w-2 h-2 rounded-full ${health?.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                {health?.status === "online" ? "En Línea (FastAPI)" : "Desconectado"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5">
              <span className="text-gray-500 block">Motor FFmpeg:</span>
              <span className="font-semibold text-cyan-300 flex items-center gap-1.5 mt-1">
                <Cpu className="w-3.5 h-3.5" />
                {health?.ffmpeg ? "Integrado y Listo" : "Detectando..."}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 col-span-2">
              <span className="text-gray-500 block">Cookies de Sesión (Meta / YouTube):</span>
              <span className={`font-semibold flex items-center gap-1.5 mt-1 ${health?.cookies_loaded ? "text-emerald-400" : "text-amber-400"}`}>
                {health?.cookies_loaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Activas (Bypass 403 habilitado)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>No cargadas (Usando User-Agents rotativos)</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Cookies.txt Upload Section */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Importar Archivo cookies.txt</span>
            </h4>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Para extraer contenido privado, historias de Instagram o evitar errores 403 de YouTube en IPs de hosting, exporta tus cookies en formato Netscape y súbelas aquí:
            </p>
          </div>

          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 hover:border-cyan-400/50 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer transition group">
            <UploadCloud className="w-8 h-8 text-gray-500 group-hover:text-cyan-400 transition-colors mb-2" />
            <span className="text-xs font-semibold text-gray-300 group-hover:text-white">
              {uploading ? "Subiendo archivo..." : "Selecciona o arrastra tu cookies.txt"}
            </span>
            <span className="text-[11px] text-gray-500 mt-1">Formato Netscape Cookie File (*.txt)</span>
            <input
              type="file"
              accept=".txt"
              className="hidden"
              disabled={uploading}
              onChange={handleFileUpload}
            />
          </label>

          {uploadStatus && (
            <p className="text-xs text-center font-medium text-cyan-300">
              {uploadStatus}
            </p>
          )}

          {/* Proxy Guidance Notice */}
          <div className="p-4 rounded-2xl bg-cyan-500/[0.04] border border-cyan-500/20 text-xs text-cyan-200 space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-cyan-300">
              <Globe className="w-3.5 h-3.5" />
              <span>Rotación de Proxies Residenciales</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-[11px]">
              OmniPull soporta la variable de entorno <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">PROXY_POOL</code> con IPs separadas por comas. El motor selecciona una IP aleatoria por petición para distribuir el tráfico y prevenir limitaciones de cuota.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
