/**
 * OmniPull API Client
 * Connects directly to FastAPI backend (bypassing Next.js proxy rewrite issues like ECONNRESET)
 * with automatic fallback and bulletproof error parsing.
 */

export function getApiBaseUrl(): string {
  // 1. Client-side manual override (saved via Settings modal)
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("vvideo_custom_api_url");
    if (custom && custom.trim()) {
      let clean = custom.trim();
      if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        clean = `https://${clean}`;
      }
      return clean.replace(/\/+$/, "");
    }
  }

  // 2. Next.js public environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    let clean = process.env.NEXT_PUBLIC_API_URL.trim();
    if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
      clean = `https://${clean}`;
    }
    return clean.replace(/\/+$/, "");
  }

  // 3. Fallback based on current browser URL
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "127.0.0.1";
    // If running on Render, automatically point to standard backend naming
    if (hostname.endsWith(".onrender.com")) {
      if (hostname.includes("vvideosdownloaderpro")) {
        return "https://vvideosdownloaderpro-api.onrender.com";
      }
      const prefix = hostname.replace(".onrender.com", "").replace(/-web$/, "");
      return `https://${prefix}-api.onrender.com`;
    }
    return `http://${hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
}

export function setCustomApiUrl(url: string | null) {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      let clean = url.trim();
      if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
        clean = `https://${clean}`;
      }
      clean = clean.replace(/\/+$/, "");
      localStorage.setItem("vvideo_custom_api_url", clean);
    } else {
      localStorage.removeItem("vvideo_custom_api_url");
    }
  }
}

export function getCustomApiUrl(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("vvideo_custom_api_url") || "";
  }
  return "";
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${cleanEndpoint}`;
}

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: ApiFetchOptions
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const directUrl = getApiUrl(cleanEndpoint);
  const fallbackUrl = cleanEndpoint; // Relative Next.js proxy

  let res: Response;

  // 1. Try direct backend connection first (zero proxy overhead, no socket hang ups)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 120000);

    res = await fetch(directUrl, {
      ...options,
      signal: options?.signal || controller.signal,
    });
    clearTimeout(timeout);
  } catch (directErr) {
    if (directErr instanceof DOMException && directErr.name === "AbortError") {
      throw new Error(
        "El análisis tardó demasiado. Prueba con el enlace directo del video (no de búsqueda o lista)."
      );
    }
    // 2. If direct fails (network/CORS), fallback to relative proxy
    try {
      res = await fetch(fallbackUrl, options);
    } catch {
      throw new Error(
        "No se pudo conectar con el servidor backend (puerto 8000). Asegúrate de que el backend esté en ejecución."
      );
    }
  }

  // 3. Bulletproof response parsing (never throws "Unexpected token in JSON")
  const rawText = await res.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = rawText;
    }
  }

  // 4. Handle HTTP errors gracefully
  if (!res.ok) {
    let errorMessage = "Error en el servidor.";
    if (data && typeof data === "object" && data.detail) {
      if (typeof data.detail === "string") {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      } else {
        errorMessage = JSON.stringify(data.detail);
      }
    } else if (typeof data === "string" && data.trim()) {
      errorMessage = data.replace(/^<[^>]+>/g, "").slice(0, 300);
    } else {
      errorMessage = `Error del servidor (${res.status} ${res.statusText})`;
    }

    if (errorMessage.toLowerCase().includes("internal server error")) {
      errorMessage = "El motor Backend (API de Python) no está respondiendo o aún no fue creado en Render. Ve al menú Anti-Bloqueos en la barra superior para verificar o configurar la URL de tu API.";
    }

    throw new Error(errorMessage);
  }

  return data as T;
}
