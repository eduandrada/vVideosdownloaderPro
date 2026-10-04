# vVideosdownloaderPro v2 ⚡

> **Suite Multimedia de Alto Rendimiento: Extracción 4K, Transcodificación FFmpeg & Eliminador de Marcas de Agua**  
> *Desarrollado por **Eduardo Andrada** / Catamarca / FastAPI, yt-dlp, FFmpeg & Next.js*

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Ready-007808?logo=ffmpeg)](https://ffmpeg.org/)
[![yt--dlp](https://img.shields.io/badge/yt--dlp-2025+-red)](https://github.com/yt-dlp/yt-dlp)

---

## 📱 Optimizado para Celular / Móvil & Escritorio

`vVideosdownloaderPro v2` está diseñado con enfoque **Mobile-First / Touch-Friendly**:
- **Smart Paste con un toque:** Detecta automáticamente enlaces copiados en el portapapeles de tu teléfono.
- **Diseño Ultra Responsivo:** Interfaz Cyber Dark Glassmorphism ajustada para pantallas desde 320px (smartphones) hasta monitores 4K.
- **Áreas táctiles optimizadas:** Botones con altura mínima de 44px para una pulsación cómoda con el pulgar.
- **PWA Ready:** Soporte para agregar a la pantalla de inicio en Android y iOS como una aplicación nativa.

---

## 🌟 Características Principales

1. **Extracción Universal Multi-Plataforma:**
   - **YouTube:** Videos en 4K/1080p a 60fps, Shorts y extracción de audio MP3 en 320kbps con carátula incrustada ID3.
   - **Instagram:** Reels, videos, historias y carruseles de fotos de alta resolución.
   - **TikTok:** Descarga instantánea en stream nativo **sin marca de agua**.
   - **X (Twitter):** Videos en máxima calidad y conversión de bucles a GIF animado.
   - **Facebook & Pinterest:** Extracción optimizada directa en MP4 y JPG.

2. **Transcodificación al Vuelo con FFmpeg:**
   - Conversión automática entre MP4, WebM, GIF y MP3.
   - Recorte temporal de video (*Trimming*) antes de la descarga.
   - Presets de compresión: *Ajustar a < 25MB para Discord* o *< 16MB para WhatsApp*.

3. **Sistema de Eliminación de Marcas de Agua (3 Niveles):**
   - **Nivel 1 (Nativo):** Obtención directa del stream original sin overlay (TikTok/Reels).
   - **Nivel 2 (FFmpeg Delogo):** Eliminación algorítmica de logotipos en esquinas fijas con interpolación inteligente.
   - **Nivel 3 (AI Inpainting):** Conexión con microservicio neuronal ProPainter para reconstrucción espaciotemporal guiada por flujo óptico.

4. **Bypass Anti-Bloqueos (YouTube & Meta 403 / CAPTCHAs):**
   - Rotación dinámica de User-Agents de navegadores modernos.
   - Soporte para subir archivos `cookies.txt` de sesión (formato Netscape) para acceder a contenido privado o con restricción de edad.

---

## 🏛️ Arquitectura del Sistema

```mermaid
flowchart TD
    Client["Frontend Next.js 16 (Mobile-First / Tailwind / Framer Motion)"]
    API["Backend FastAPI (Python 3.11+)"]
    ExtractEngine["yt-dlp Engine + User-Agent Pool + Netscape Cookies"]
    FFmpegEngine["FFmpeg Engine (Transcodificación, Recorte y Delogo)"]
    AIWorker["ProPainter Microservice (Inpainting GPU)"]
    TaskManager["TaskManager Asíncrono (EventSource / SSE)"]
    Storage["Almacenamiento Efímero (TTL 15 min con Auto-Cleanup)"]

    Client -->|1. POST /api/analyze| API
    API -->|Dump-JSON < 1.5s| ExtractEngine
    ExtractEngine -->|Metadatos y Formatos| API
    API -->|Visualización Inmediata| Client

    Client -->|2. POST /api/download| API
    Client -->|2b. POST /api/watermark/delogo| API
    
    API -->|Encolar Tarea| TaskManager
    TaskManager -->|Streaming yt-dlp| ExtractEngine
    TaskManager -->|SSE /api/progress| Client
    
    TaskManager -->|Procesamiento| FFmpegEngine
    TaskManager -.->|Inpainting IA Opcional| AIWorker
    
    FFmpegEngine --> Storage
    Storage -->|Descarga Final /api/file/{id}| Client
```

---

## 🚀 Despliegue en Render (Paso a Paso)

Este repositorio incluye [`render.yaml`](render.yaml) configurado para desplegar ambos servicios con un solo clic mediante **Render Blueprints**.

### 1. Despliegue Automático con Blueprint:
1. Sube tu código a GitHub: `https://github.com/eduandrada/vVideosdownloaderPro.git`
2. Ve a [dashboard.render.com](https://dashboard.render.com/) y haz clic en **New +** -> **Blueprint**.
3. Conecta tu repositorio `vVideosdownloaderPro`.
4. Render creará automáticamente:
   - **`vvideosdownloaderpro-api`** (Web Service Python con FastAPI y FFmpeg preconfigurado vía `imageio-ffmpeg`).
   - **`vvideosdownloaderpro-web`** (Web Service Node.js con Next.js 16).
5. Haz clic en **Apply**. ¡Listo!

### 2. Variables de Entorno en Render:
- En el servicio Frontend (`vvideosdownloaderpro-web`):
  - `NEXT_PUBLIC_API_URL`: URL de tu backend en Render (ej. `https://vvideosdownloaderpro-api.onrender.com`).
- En el servicio Backend (`vvideosdownloaderpro-api`):
  - `ALLOWED_ORIGINS`: `*` (o la URL de tu frontend).
  - `PYTHON_VERSION`: `3.11.9`

---

## 💻 Ejecución Local en Windows

### En un solo clic:
Haz doble clic en el archivo:
```cmd
iniciar.bat
```
El script liberará los puertos 8000 y 3000 en milisegundos, iniciará el backend y frontend, y abrirá automáticamente tu navegador.

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/analyze` | Analiza el enlace y devuelve metadatos y formatos sin descargar en < 1.5s |
| `POST` | `/api/download` | Encola la descarga/transcodificación regular y retorna `task_id` |
| `POST` | `/api/watermark/delogo` | Elimina marcas fijas con FFmpeg Delogo en 2-5 segundos |
| `POST` | `/api/watermark/ai-inpaint`| Inpainting neuronal temporal con ProPainter |
| `GET` | `/api/progress/{task_id}` | Transmite el progreso en tiempo real mediante **Server-Sent Events (SSE)** |
| `GET` | `/api/file/{task_id}` | Descarga el archivo procesado final |
| `POST` | `/api/cookies` | Sube un archivo `cookies.txt` de Netscape para sortear bloqueos |
| `GET` | `/api/health` | Estado del backend, ruta de FFmpeg y comprobación de cookies |

---

## 👤 Créditos y Autor

- **Autor:** Eduardo Andrada
- **Ubicación:** Catamarca, Argentina
- **Tecnologías:** FastAPI, yt-dlp, FFmpeg, Next.js 16, Tailwind CSS, TypeScript & Python.
- **Repositorio:** [github.com/eduandrada/vVideosdownloaderPro](https://github.com/eduandrada/vVideosdownloaderPro)

---

© 2026 **vVideosdownloaderPro v2** — Todos los derechos reservados.
