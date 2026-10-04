import os
import re
import random
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable
import yt_dlp
from urllib.parse import urlparse, parse_qs

from config import USER_AGENTS, COOKIES_FILE, TEMP_DIR, get_ffmpeg_path

# Regex definitions for major platforms
PLATFORM_PATTERNS = {
    "youtube": r"(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com|youtu\.be)",
    "instagram": r"(?:https?:\/\/)?(?:www\.)?instagram\.com",
    "tiktok": r"(?:https?:\/\/)?(?:www\.|vm\.|vt\.)?tiktok\.com",
    "twitter": r"(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)",
    "facebook": r"(?:https?:\/\/)?(?:www\.|web\.|m\.)?(?:facebook\.com|fb\.watch)",
    "pinterest": r"(?:https?:\/\/)?(?:www\.|[a-z]{2}\.)?pinterest\.(?:com|[a-z]{2,3}(?:\.[a-z]{2})?)"
}

def detect_platform(url: str) -> Dict[str, str]:
    """Detect platform name and visual color/icon identifier from URL."""
    url_lower = url.lower()
    for platform, pattern in PLATFORM_PATTERNS.items():
        if re.search(pattern, url_lower):
            name_map = {
                "youtube": ("YouTube", "red", "#FF0000"),
                "instagram": ("Instagram", "pink", "#E1306C"),
                "tiktok": ("TikTok", "cyan", "#00F2FE"),
                "twitter": ("X (Twitter)", "slate", "#1DA1F2"),
                "facebook": ("Facebook", "blue", "#1877F2"),
                "pinterest": ("Pinterest", "rose", "#E60023")
            }
            name, badge_color, hex_color = name_map[platform]
            return {
                "id": platform,
                "name": name,
                "badge_color": badge_color,
                "hex_color": hex_color
            }
    return {
        "id": "generic",
        "name": "Web Universal",
        "badge_color": "violet",
        "hex_color": "#8B5CF6"
    }

class MediaExtractor:
    def __init__(self):
        self.proxy_pool: List[str] = [
            p.strip() for p in os.getenv("PROXY_POOL", "").split(",") if p.strip()
        ]

    def _get_random_proxy(self) -> Optional[str]:
        if self.proxy_pool:
            return random.choice(self.proxy_pool)
        return os.getenv("HTTP_PROXY") or os.getenv("HTTPS_PROXY")

    def _get_base_ydl_opts(self, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        user_agent = random.choice(USER_AGENTS)
        opts = {
            "quiet": True,
            "no_warnings": True,
            "user_agent": user_agent,
            "nocheckcertificate": True,
            "noplaylist": True,
            "socket_timeout": 20,
            "ffmpeg_location": get_ffmpeg_path(),
        }

        # Extractor arguments for native watermark-free extraction (TikTok, Douyin, Reels, YouTube)
        opts["extractor_args"] = {
            "tiktok": {
                "api_hostname": "api16-normal-c-useast1a.tiktokv.com",
            },
            "instagram": {
                "api_hostname": "i.instagram.com"
            },
            "youtube": {
                "player_client": ["android", "web", "mweb", "ios"]
            }
        }

        # Check for cookies file
        if COOKIES_FILE.exists() and COOKIES_FILE.stat().st_size > 0:
            opts["cookiefile"] = str(COOKIES_FILE)

        # Proxy rotation
        proxy = self._get_random_proxy()
        if proxy:
            opts["proxy"] = proxy

        if extra:
            opts.update(extra)

        return opts

    def _resolve_url_sync(self, url: str) -> str:
        """Turn search / playlist / channel links into a single video URL quickly
        (flat extraction, no per-entry format resolution)."""
        try:
            parsed = urlparse(url)
            host = (parsed.netloc or "").lower()
            qs = parse_qs(parsed.query)
        except Exception:
            return url

        is_youtube = "youtube.com" in host or "youtu.be" in host
        if not is_youtube:
            return url

        target: Optional[str] = None
        if parsed.path.startswith("/results") and qs.get("search_query"):
            target = f"ytsearch1:{qs['search_query'][0]}"
        elif qs.get("v"):
            # Plain watch link (strip &list=, &index=, etc.)
            return f"https://www.youtube.com/watch?v={qs['v'][0]}"
        elif parsed.path.startswith("/playlist") or parsed.path.startswith("/@") \
                or parsed.path.startswith("/channel") or parsed.path.startswith("/c/"):
            target = url

        if not target:
            return url

        opts = self._get_base_ydl_opts({
            "extract_flat": "in_playlist",
            "playlistend": 1,
            "skip_download": True,
        })
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(target, download=False)

        for entry in (info or {}).get("entries") or []:
            if not isinstance(entry, dict):
                continue
            vid = entry.get("id")
            entry_url = entry.get("url") or ""
            if entry_url.startswith("http") and "watch" in entry_url:
                return entry_url
            if vid and len(vid) == 11:
                return f"https://www.youtube.com/watch?v={vid}"
        raise ValueError("No se encontraron videos en esa búsqueda o lista. Copia el enlace directo del video.")

    async def resolve_url(self, url: str) -> str:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, self._resolve_url_sync, url)

    async def analyze_url(self, url: str) -> Dict[str, Any]:
        """Extract metadata without downloading the media, grouped by formats."""
        platform_info = detect_platform(url)
        url = await self.resolve_url(url)

        def _extract():
            ydl_opts = self._get_base_ydl_opts({"skip_download": True})
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                return ydl.extract_info(url, download=False)

        loop = asyncio.get_running_loop()
        try:
            info = await loop.run_in_executor(None, _extract)
        except Exception as e:
            # Clean and user friendly error message
            msg = str(e)
            if "Private video" in msg:
                raise ValueError("Este video o publicación es privado o no está disponible públicamente. Si tienes acceso, puedes cargar tu archivo cookies.txt en el menú Anti-Bloqueos.")
            elif "Sign in to confirm" in msg or "bot" in msg.lower():
                raise ValueError("La plataforma requiere verificación anti-bot o inicio de sesión. Carga tu archivo cookies.txt en el menú Anti-Bloqueos de la barra superior.")
            elif "403" in msg or "Forbidden" in msg:
                raise ValueError("Acceso restringido por la plataforma (Error 403). Se sugiere cargar cookies.txt en el menú superior o reintentar en unos segundos.")
            elif "Video unavailable" in msg or "not available" in msg.lower():
                raise ValueError("El video o publicación no está disponible o fue eliminado por el autor.")
            
            # Remove any ugly yt_dlp prefixes
            clean_msg = re.sub(r'^(ERROR:\s*(\[[^\]]+\]\s*)?)+', '', msg).strip()
            raise ValueError(f"No se pudo extraer información: {clean_msg}")

        # If it's a search result page or playlist, unpack the first matching video
        if "entries" in info and info["entries"]:
            for entry in info["entries"]:
                if isinstance(entry, dict) and entry.get("formats"):
                    info = entry
                    break

        # Parse duration
        duration = info.get("duration", 0)
        title = info.get("title") or "Sin título"
        uploader = info.get("uploader") or info.get("channel") or info.get("creator") or "Desconocido"
        thumbnail = info.get("thumbnail") or ""
        view_count = info.get("view_count")
        upload_date = info.get("upload_date")

        raw_formats = info.get("formats", [])
        
        # Categorize formats
        video_formats = []
        audio_formats = []
        image_formats = []

        # 1. Process Video Formats
        seen_res = set()
        for f in raw_formats:
            vcodec = f.get("vcodec", "none")
            acodec = f.get("acodec", "none")
            height = f.get("height")
            ext = f.get("ext", "mp4")
            filesize = f.get("filesize") or f.get("filesize_approx") or 0
            fps = f.get("fps") or 30

            if vcodec != "none" and height and height >= 144:
                res_key = f"{height}p{'_60' if fps and fps >= 50 else ''}"
                
                # Assign friendly badges
                badge = f"{height}p"
                if height >= 2160:
                    badge = "4K Ultra HD"
                elif height >= 1440:
                    badge = "2K QHD"
                elif height >= 1080:
                    badge = f"1080p Full HD{' 60fps' if fps and fps >= 50 else ''}"
                elif height >= 720:
                    badge = f"720p HD{' 60fps' if fps and fps >= 50 else ''}"

                # Calculate estimated size if missing
                if not filesize and duration and f.get("tbr"):
                    filesize = int((f["tbr"] * 1024 / 8) * duration)
                size_mb = round(filesize / (1024 * 1024), 1) if filesize else None

                has_audio = (acodec != "none")

                # Store format if not redundant
                unique_key = (height, ext, has_audio)
                if unique_key not in seen_res:
                    seen_res.add(unique_key)
                    video_formats.append({
                        "format_id": f.get("format_id"),
                        "quality_label": badge,
                        "height": height,
                        "fps": fps,
                        "ext": ext,
                        "size_mb": size_mb,
                        "has_audio": has_audio,
                        "note": f.get("format_note", "") or f"{ext.upper()}",
                        "url": f.get("url") if has_audio else None
                    })

        # Sort video formats descending by height
        video_formats.sort(key=lambda x: (x["height"], 1 if x["has_audio"] else 0), reverse=True)

        # 2. Process Audio Formats
        audio_presets = [
            {"label": "MP3 Studio Master", "bitrate": "320k", "ext": "mp3", "kbps": 320},
            {"label": "MP3 High Fidelity", "bitrate": "256k", "ext": "mp3", "kbps": 256},
            {"label": "MP3 Estándar", "bitrate": "192k", "ext": "mp3", "kbps": 192},
            {"label": "M4A / AAC Nativo", "bitrate": "160k", "ext": "m4a", "kbps": 160},
            {"label": "FLAC / WAV Sin Pérdida", "bitrate": "lossless", "ext": "wav", "kbps": 1411},
        ]
        for preset in audio_presets:
            est_size = round((preset["kbps"] * 1000 / 8 * duration) / (1024 * 1024), 1) if duration else None
            audio_formats.append({
                "label": preset["label"],
                "ext": preset["ext"],
                "bitrate": preset["bitrate"],
                "size_mb": est_size
            })

        # 3. Process Images / Thumbnails / Carousel items
        # Check carousel entries
        entries = info.get("entries")
        if entries and isinstance(entries, list):
            for idx, entry in enumerate(entries):
                img_url = entry.get("url") or entry.get("thumbnail")
                if img_url:
                    image_formats.append({
                        "label": f"Imagen Carrusel #{idx + 1}",
                        "url": img_url,
                        "ext": "jpg",
                        "width": entry.get("width"),
                        "height": entry.get("height")
                    })
        elif thumbnail:
            image_formats.append({
                "label": "Miniatura Original HD",
                "url": thumbnail,
                "ext": "jpg",
                "width": 1920,
                "height": 1080
            })

        return {
            "title": title,
            "uploader": uploader,
            "duration": duration,
            "duration_formatted": self._format_duration(duration),
            "thumbnail": thumbnail,
            "platform": platform_info,
            "view_count": view_count,
            "upload_date": upload_date,
            "video_formats": video_formats[:8], # Top 8 qualities
            "audio_formats": audio_formats,
            "image_formats": image_formats,
            "is_direct_streamable": bool(video_formats and video_formats[0].get("has_audio") and video_formats[0].get("url"))
        }

    def _format_duration(self, seconds: int) -> str:
        if not seconds:
            return "00:00"
        m, s = divmod(seconds, 60)
        h, m = divmod(m, 60)
        if h > 0:
            return f"{h:02d}:{m:02d}:{s:02d}"
        return f"{m:02d}:{s:02d}"

    async def download_media(
        self,
        url: str,
        format_id: Optional[str] = None,
        extract_audio: bool = False,
        progress_callback: Optional[Callable] = None
    ) -> Path:
        """Download requested stream to local temporary directory with real-time progress."""
        loop = asyncio.get_running_loop()
        url = await self.resolve_url(url)
        out_template = str(TEMP_DIR / "%(id)s.%(ext)s")

        def hook(d):
            if not progress_callback:
                return
            try:
                status = d.get("status")
                if status == "downloading":
                    total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
                    downloaded = d.get("downloaded_bytes") or 0
                    pct = (downloaded / total * 100.0) if total > 0 else 0
                    speed = d.get("_speed_str", "")
                    eta = d.get("_eta_str", "")
                    
                    asyncio.run_coroutine_threadsafe(
                        progress_callback(pct, f"Descargando: {pct:.1f}% ({speed})", speed, eta),
                        loop
                    )
                elif status == "finished":
                    asyncio.run_coroutine_threadsafe(
                        progress_callback(100.0, "Descarga completada. Preparando procesamiento..."),
                        loop
                    )
            except Exception:
                pass

        ydl_opts: Dict[str, Any] = {
            "outtmpl": out_template,
            "progress_hooks": [hook],
            "merge_output_format": "mp4",
        }

        if format_id:
            # Try format + best audio, fallback to format directly or best
            ydl_opts["format"] = f"{format_id}+bestaudio/{format_id}/best"
        elif extract_audio:
            ydl_opts["format"] = "bestaudio/best"
        else:
            ydl_opts["format"] = "best[format_id*=no-watermark]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"

        full_opts = self._get_base_ydl_opts(ydl_opts)

        def _run_dl():
            with yt_dlp.YoutubeDL(full_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                # In case yt-dlp merged to mp4 or mkv
                base, _ = os.path.splitext(filename)
                for candidate in (filename, f"{base}.mp4", f"{base}.mkv", f"{base}.webm"):
                    if os.path.exists(candidate):
                        return Path(candidate)
                return Path(filename)

        return await loop.run_in_executor(None, _run_dl)

extractor = MediaExtractor()
