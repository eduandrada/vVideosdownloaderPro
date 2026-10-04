"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import confetti from "canvas-confetti";
import { MediaMetadata, TaskProgress, DownloadOptions, PlatformInfo } from "@/types/media";
import { apiFetch, getApiUrl } from "@/lib/api";

// Client-side quick platform detection regex
export function detectPlatformClient(url: string): PlatformInfo {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    return { id: "youtube", name: "YouTube", badge_color: "bg-red-500/10 text-red-400 border-red-500/20", hex_color: "#EF4444" };
  }
  if (u.includes("instagram.com")) {
    return { id: "instagram", name: "Instagram", badge_color: "bg-pink-500/10 text-pink-400 border-pink-500/20", hex_color: "#EC4899" };
  }
  if (u.includes("tiktok.com")) {
    return { id: "tiktok", name: "TikTok", badge_color: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20", hex_color: "#06B6D4" };
  }
  if (u.includes("twitter.com") || u.includes("x.com")) {
    return { id: "twitter", name: "X / Twitter", badge_color: "bg-sky-500/10 text-sky-400 border-sky-500/20", hex_color: "#38BDF8" };
  }
  if (u.includes("facebook.com") || u.includes("fb.watch")) {
    return { id: "facebook", name: "Facebook", badge_color: "bg-blue-600/10 text-blue-400 border-blue-500/20", hex_color: "#3B82F6" };
  }
  if (u.includes("pinterest.com") || u.includes("pin.it")) {
    return { id: "pinterest", name: "Pinterest", badge_color: "bg-rose-500/10 text-rose-400 border-rose-500/20", hex_color: "#F43F5E" };
  }
  return { id: "generic", name: "Universal Link", badge_color: "bg-violet-500/10 text-violet-400 border-violet-500/20", hex_color: "#8B5CF6" };
}

export function useMediaDownloader() {
  const [url, setUrl] = useState("");
  const detectedPlatform = useMemo<PlatformInfo | null>(() => {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return detectPlatformClient(trimmed);
    }
    return null;
  }, [url]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Download Task state
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<TaskProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [autoPasteNotification, setAutoPasteNotification] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const lastClipboardUrlRef = useRef<string>("");

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Analyze URL via Backend
  const analyzeUrl = useCallback(async (targetUrl?: string) => {
    const inputUrl = (targetUrl || url).trim();
    if (!inputUrl) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setMetadata(null);
    setProgressData(null);
    setActiveTaskId(null);

    try {
      const json = await apiFetch<{ success: boolean; data: MediaMetadata }>("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl })
      });

      setMetadata(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado al contactar con el backend.";
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [url]);

  // Smart Paste Handler
  const pasteFromClipboard = useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const trimmed = text.trim();
        if (trimmed && (trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
          setUrl(trimmed);
          lastClipboardUrlRef.current = trimmed;
          setAutoPasteNotification(trimmed);
          setTimeout(() => setAutoPasteNotification(null), 3500);
          analyzeUrl(trimmed);
          return trimmed;
        }
      }
    } catch {
      // Clipboard permission denied or unsupported
    }
    return null;
  }, [analyzeUrl]);

  // Automatic Clipboard Listener on Window Focus & Tab Switch
  useEffect(() => {
    const handleAutoDetectClipboard = async () => {
      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          const text = await navigator.clipboard.readText();
          const trimmed = (text || "").trim();
          
          // Check if valid URL and matches media domain
          const isUrl = trimmed.startsWith("http://") || trimmed.startsWith("https://");
          const isMedia = isUrl && (
            trimmed.includes("youtube.com") || 
            trimmed.includes("youtu.be") || 
            trimmed.includes("tiktok.com") || 
            trimmed.includes("instagram.com") || 
            trimmed.includes("twitter.com") || 
            trimmed.includes("x.com") || 
            trimmed.includes("facebook.com") || 
            trimmed.includes("fb.watch") || 
            trimmed.includes("pinterest.com") ||
            trimmed.includes("pin.it") ||
            trimmed.includes("reddit.com") ||
            trimmed.includes("vimeo.com") ||
            trimmed.includes("twitch.tv") ||
            trimmed.includes("soundcloud.com") ||
            trimmed.includes("threads.net") ||
            trimmed.includes("dailymotion.com") ||
            trimmed.includes("bilibili.com") ||
            trimmed.includes("spotify.com")
          );

          if (isMedia && trimmed !== lastClipboardUrlRef.current && trimmed !== url) {
            lastClipboardUrlRef.current = trimmed;
            setUrl(trimmed);
            setAutoPasteNotification(trimmed);
            setTimeout(() => setAutoPasteNotification(null), 4000);
            analyzeUrl(trimmed);
          }
        }
      } catch {
        // Silently skip if user hasn't granted clipboard focus permission yet
      }
    };

    window.addEventListener("focus", handleAutoDetectClipboard);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleAutoDetectClipboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Global Paste Listener (Ctrl+V anywhere on screen)
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "INPUT" && (target as HTMLInputElement).type === "text") {
        return; // Handled directly by the input element
      }
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
        setUrl(text);
        lastClipboardUrlRef.current = text;
        setAutoPasteNotification(text);
        setTimeout(() => setAutoPasteNotification(null), 4000);
        analyzeUrl(text);
      }
    };

    window.addEventListener("paste", handleGlobalPaste);

    return () => {
      window.removeEventListener("focus", handleAutoDetectClipboard);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [url, analyzeUrl]);

  // Start Download and connect to SSE stream
  const startDownload = useCallback(async (options: DownloadOptions) => {
    setIsDownloading(true);
    setDownloadError(null);
    setProgressData({
      id: "pending",
      status: "queued",
      progress: 2,
      step: "Encolando",
      message: "Enviando solicitud al clúster de procesamiento..."
    });

    try {
      const json = await apiFetch<{ success: boolean; task_id: string }>("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options)
      });

      const taskId = json.task_id;
      setActiveTaskId(taskId);

      // Close previous SSE if any
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Connect to SSE Progress stream directly
      const es = new EventSource(getApiUrl(`/api/progress/${taskId}`));
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data: TaskProgress = JSON.parse(event.data);
          setProgressData(data);

          if (data.status === "completed") {
            es.close();
            setIsDownloading(false);

            // Trigger confetti
            try {
              confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ["#8B5CF6", "#06B6D4", "#EC4899", "#10B981"]
              });
            } catch {}

            // Trigger browser download automatically
            const link = document.createElement("a");
            link.href = getApiUrl(`/api/file/${taskId}`);
            link.setAttribute("download", data.filename || "download");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (data.status === "failed") {
            es.close();
            setIsDownloading(false);
            setDownloadError(data.error || "Ocurrió un error en el procesamiento.");
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      es.onerror = () => {
        // Fallback check
        es.close();
      };
    } catch (err: unknown) {
      setIsDownloading(false);
      const msg = err instanceof Error ? err.message : "Error de conexión con el servidor.";
      setDownloadError(msg);
    }
  }, []);

  // Process Watermark Removal (Delogo or AI Inpainting)
  const processWatermark = useCallback(async (params: {
    mode: "delogo" | "ai_inpaint";
    box: { x: number; y: number; width: number; height: number };
    startTime?: number;
    endTime?: number;
  }) => {
    setIsDownloading(true);
    setDownloadError(null);
    setProgressData({
      id: "pending",
      status: "queued",
      progress: 5,
      step: params.mode === "ai_inpaint" ? "Inpainting IA" : "Delogo FFmpeg",
      message: params.mode === "ai_inpaint" 
        ? "Inicializando motor neuronal ProPainter..." 
        : "Preparando interpolación algorítmica..."
    });

    try {
      const endpoint = params.mode === "ai_inpaint" 
        ? "/api/watermark/ai-inpaint" 
        : "/api/watermark/delogo";

      const json = await apiFetch<{ success: boolean; task_id: string }>(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url,
          box: params.box,
          start_time: params.startTime,
          end_time: params.endTime,
          title: metadata?.title,
          duration: metadata?.duration
        })
      });

      const taskId = json.task_id;
      setActiveTaskId(taskId);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(getApiUrl(`/api/progress/${taskId}`));
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const data: TaskProgress = JSON.parse(event.data);
          setProgressData(data);

          if (data.status === "completed") {
            es.close();
            setIsDownloading(false);

            try {
              confetti({
                particleCount: 100,
                spread: 80,
                origin: { y: 0.6 },
                colors: ["#06B6D4", "#8B5CF6", "#10B981"]
              });
            } catch {}

            const link = document.createElement("a");
            link.href = getApiUrl(`/api/file/${taskId}`);
            link.setAttribute("download", data.filename || "clean_video.mp4");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else if (data.status === "failed") {
            es.close();
            setIsDownloading(false);
            setDownloadError(data.error || "Ocurrió un error al remover la marca.");
          }
        } catch (e) {
          console.error("SSE error", e);
        }
      };

      es.onerror = () => {
        es.close();
      };
    } catch (err: unknown) {
      setIsDownloading(false);
      const msg = err instanceof Error ? err.message : "Error al comunicar con el servidor.";
      setDownloadError(msg);
    }
  }, [url, metadata]);

  const resetAll = useCallback(() => {
    setUrl("");
    setMetadata(null);
    setAnalysisError(null);
    setProgressData(null);
    setActiveTaskId(null);
    setDownloadError(null);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
  }, []);

  return {
    url,
    setUrl,
    detectedPlatform,
    isAnalyzing,
    metadata,
    analysisError,
    activeTaskId,
    progressData,
    isDownloading,
    downloadError,
    pasteFromClipboard,
    analyzeUrl,
    startDownload,
    processWatermark,
    autoPasteNotification,
    resetAll
  };
}
