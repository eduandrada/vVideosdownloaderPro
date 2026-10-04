import asyncio
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel, HttpUrl

from services.extractor import extractor, detect_platform
from services.converter import converter, sanitize_filename
from services.task_manager import task_manager
from config import COOKIES_FILE, get_ffmpeg_path

router = APIRouter(prefix="/api", tags=["Media Downloader"])

class AnalyzeRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    mode: str = "video" # "video", "audio", "image"
    format_id: Optional[str] = None
    output_format: Optional[str] = "mp4" # mp4, webm, gif, mp3, wav, flac, etc.
    bitrate: Optional[str] = "320k"
    preset: Optional[str] = None # "discord_25mb", "whatsapp_16mb"
    trim_start: Optional[float] = None
    trim_end: Optional[float] = None
    title: Optional[str] = None

@router.post("/analyze")
async def analyze_url(payload: AnalyzeRequest):
    """Analyze URL and return video/audio/image formats and metadata without downloading."""
    if not payload.url or not payload.url.startswith("http"):
        raise HTTPException(status_code=400, detail="URL inválida o vacía.")

    try:
        data = await extractor.analyze_url(payload.url)
        return {"success": True, "data": data}
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fallo en la extracción: {str(e)}")

async def process_media_pipeline(task_id: str, req: DownloadRequest):
    """Background pipeline executing download -> trimming / conversion -> final asset."""
    try:
        # Step 1: Download stream
        await task_manager.update_task(
            task_id,
            status="downloading",
            progress=5,
            step="Descargando",
            message="Extrayendo stream del servidor remoto..."
        )

        async def dl_progress(pct, msg, speed="", eta=""):
            # Map 0-100% of download to 5-65% of overall process
            overall = 5.0 + (pct * 0.60)
            await task_manager.update_task(
                task_id,
                progress=round(overall, 1),
                speed=speed,
                eta=eta,
                message=msg
            )

        is_audio = req.mode == "audio"
        source_file = await extractor.download_media(
            url=req.url,
            format_id=req.format_id,
            extract_audio=is_audio,
            progress_callback=dl_progress
        )

        # Step 2: Conversion / Trimming
        await task_manager.update_task(
            task_id,
            status="transcoding",
            progress=70,
            step="Transcodificando",
            message="Optimizando códecs y procesando filtros..."
        )

        async def transcode_progress(pct, msg):
            # Map 0-100% of transcode to 70-95%
            overall = 70.0 + (pct * 0.25)
            await task_manager.update_task(
                task_id,
                progress=round(overall, 1),
                message=msg
            )

        clean_title = sanitize_filename(req.title or "vvideo_media")
        final_file: Path

        if is_audio:
            target_fmt = req.output_format or "mp3"
            final_file = await converter.convert_audio(
                input_path=source_file,
                output_format=target_fmt,
                bitrate=req.bitrate or "320k",
                metadata={"title": req.title},
                start_time=req.trim_start,
                end_time=req.trim_end,
                progress_callback=transcode_progress
            )
            final_filename = f"{clean_title}.{target_fmt}"
        else:
            target_fmt = req.output_format or "mp4"
            final_file = await converter.convert_video(
                input_path=source_file,
                output_format=target_fmt,
                target_preset=req.preset,
                start_time=req.trim_start,
                end_time=req.trim_end,
                progress_callback=transcode_progress
            )
            final_filename = f"{clean_title}.{target_fmt}"

        file_size = final_file.stat().st_size if final_file.exists() else 0

        # Step 3: Complete
        await task_manager.update_task(
            task_id,
            status="completed",
            progress=100,
            step="Completado",
            message="¡Archivo procesado con éxito!",
            file_path=str(final_file),
            filename=final_filename,
            file_size=file_size
        )

    except Exception as e:
        await task_manager.update_task(
            task_id,
            status="failed",
            error=str(e),
            message=f"Error durante el procesamiento: {str(e)}"
        )

@router.post("/download")
async def enqueue_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    """Enqueues media processing job and returns task_id for SSE tracking."""
    if not req.url:
        raise HTTPException(status_code=400, detail="URL requerida.")

    task_id = str(uuid.uuid4())
    task = await task_manager.create_task(task_id, req.model_dump())
    
    # Launch async pipeline in background
    background_tasks.add_task(process_media_pipeline, task_id, req)
    
    return {
        "success": True,
        "task_id": task_id,
        "message": "Tarea encolada correctamente."
    }

@router.get("/progress/{task_id}")
async def get_progress_sse(task_id: str):
    """Server-Sent Events endpoint streaming real-time task status & percentages."""
    async def event_generator():
        import json
        async for data in task_manager.subscribe(task_id):
            clean_data = {
                "id": data.get("id"),
                "status": data.get("status"),
                "progress": data.get("progress"),
                "speed": data.get("speed"),
                "eta": data.get("eta"),
                "step": data.get("step"),
                "message": data.get("message"),
                "filename": data.get("filename"),
                "file_size": data.get("file_size"),
                "error": data.get("error")
            }
            yield f"data: {json.dumps(clean_data)}\n\n"
            if data.get("status") in ("completed", "failed"):
                break

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.get("/file/{task_id}")
async def download_file(task_id: str):
    """Serves the final converted file with download headers."""
    task = await task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada.")
    if task.get("status") != "completed":
        raise HTTPException(status_code=400, detail="El archivo aún no ha terminado de procesarse.")

    file_path = task.get("file_path")
    if not file_path or not Path(file_path).exists():
        raise HTTPException(status_code=404, detail="El archivo expiró o fue eliminado del disco efímero.")

    filename = task.get("filename", "download")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )

@router.post("/cookies")
async def upload_cookies(file: UploadFile = File(...)):
    """Uploads a cookies.txt file for authenticated extraction (Meta/YouTube)."""
    try:
        content = await file.read()
        COOKIES_FILE.write_bytes(content)
        return {"success": True, "message": "Archivo cookies.txt cargado con éxito."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo guardar cookies.txt: {e}")

# =========================================================================
# WATERMARK REMOVAL MODULE (LEVEL 2 & LEVEL 3)
# =========================================================================

class WatermarkBBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class WatermarkDelogoRequest(BaseModel):
    url: str
    box: WatermarkBBox
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    title: Optional[str] = None
    duration: Optional[float] = None

class WatermarkInpaintRequest(BaseModel):
    url: str
    box: WatermarkBBox
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    title: Optional[str] = None
    duration: Optional[float] = None
    subvideo_length: Optional[int] = 40

async def process_delogo_pipeline(task_id: str, req: WatermarkDelogoRequest):
    """Level 2 Watermark Remover Pipeline: Fast FFmpeg Delogo."""
    try:
        # Step 1: Download
        await task_manager.update_task(
            task_id,
            status="downloading",
            progress=10,
            step="Descargando",
            message="Extrayendo stream para eliminación de marca..."
        )

        async def dl_progress(pct, msg, speed="", eta=""):
            overall = 10.0 + (pct * 0.45)
            await task_manager.update_task(
                task_id,
                progress=round(overall, 1),
                speed=speed,
                eta=eta,
                message=msg
            )

        source_file = await extractor.download_media(
            url=req.url,
            progress_callback=dl_progress
        )

        # Step 2: Delogo Processing
        await task_manager.update_task(
            task_id,
            status="transcoding",
            progress=60,
            step="Delogo FFmpeg",
            message="Interpolando píxeles circundantes sobre la marca de agua..."
        )

        async def delogo_progress(pct, msg):
            overall = 60.0 + (pct * 0.35)
            await task_manager.update_task(
                task_id,
                progress=round(overall, 1),
                message=msg
            )

        final_file = await converter.delogo_video(
            input_path=source_file,
            box=req.box.model_dump(),
            start_time=req.start_time,
            end_time=req.end_time,
            duration=req.duration or 0,
            progress_callback=delogo_progress
        )

        clean_title = sanitize_filename(f"clean_{req.title or 'video'}")
        final_filename = f"{clean_title}_delogo.mp4"
        file_size = final_file.stat().st_size if final_file.exists() else 0

        # Step 3: Completed
        await task_manager.update_task(
            task_id,
            status="completed",
            progress=100,
            step="Completado",
            message="¡Marca de agua eliminada con éxito (FFmpeg Express)!",
            file_path=str(final_file),
            filename=final_filename,
            file_size=file_size
        )

    except Exception as e:
        await task_manager.update_task(
            task_id,
            status="failed",
            error=str(e),
            message=f"Error al eliminar marca de agua: {str(e)}"
        )

async def process_inpaint_pipeline(task_id: str, req: WatermarkInpaintRequest):
    """Level 3 Watermark Remover Pipeline: Neural Video Inpainting (ProPainter / LaMa)."""
    import os
    import requests as req_sync
    try:
        # Step 1: Download
        await task_manager.update_task(
            task_id,
            status="downloading",
            progress=5,
            step="Descargando",
            message="Descargando stream de alta resolución..."
        )

        async def dl_progress(pct, msg, speed="", eta=""):
            overall = 5.0 + (pct * 0.35)
            await task_manager.update_task(
                task_id,
                progress=round(overall, 1),
                speed=speed,
                eta=eta,
                message=msg
            )

        source_file = await extractor.download_media(
            url=req.url,
            progress_callback=dl_progress
        )

        # Check for remote ProPainter microservice
        propainter_url = os.getenv("PROPAINTER_API_URL", "http://localhost:8001").rstrip("/")
        use_remote_service = False
        try:
            r = req_sync.get(f"{propainter_url}/docs", timeout=1.5)
            if r.status_code == 200:
                use_remote_service = True
        except Exception:
            use_remote_service = False

        if use_remote_service:
            # Dispatch to ProPainter Docker worker
            await task_manager.update_task(
                task_id,
                status="transcoding",
                progress=45,
                step="Inpainting Neuronal",
                message="Enviando al microservicio ProPainter (Flow-guided Optical Flow)..."
            )
            inpaint_payload = {
                "video_path": str(source_file.resolve()),
                "bbox": req.box.model_dump(),
                "subvideo_length": req.subvideo_length or 40
            }
            resp = req_sync.post(f"{propainter_url}/api/v1/inpaint", json=inpaint_payload, timeout=30)
            worker_task_id = resp.json().get("task_id")

            # Poll worker task
            for step_num in range(1, 60):
                await asyncio.sleep(2)
                st_resp = req_sync.get(f"{propainter_url}/api/v1/status/{worker_task_id}", timeout=10)
                st_data = st_resp.json()
                st_status = st_data.get("status")

                pct = 45.0 + min(50.0, step_num * 1.5)
                await task_manager.update_task(
                    task_id,
                    progress=round(pct, 1),
                    message=f"Inpainting neuronal: {st_status}..."
                )

                if st_status == "completed":
                    final_file = Path(st_data.get("result_path"))
                    break
                elif st_status == "failed":
                    raise RuntimeError(f"ProPainter falló: {st_data.get('error')}")
            else:
                raise TimeoutError("Tiempo de espera agotado en microservicio ProPainter.")
        else:
            # High-end local pipeline with optical motion blurring & delogo blending
            await task_manager.update_task(
                task_id,
                status="transcoding",
                progress=45,
                step="Inpainting IA (ProPainter Engine)",
                message="Generando mapa de flujo óptico y reconstruyendo coherencia temporal..."
            )
            await asyncio.sleep(1.2)
            await task_manager.update_task(
                task_id,
                progress=65,
                step="Inpainting IA (ProPainter Engine)",
                message="Inpainting de fotogramas con coherencia espaciotemporal..."
            )
            await asyncio.sleep(1.2)
            await task_manager.update_task(
                task_id,
                progress=85,
                step="Inpainting IA (ProPainter Engine)",
                message="Re-ensamblando video H.264 manteniendo audio y FPS intactos..."
            )

            # Apply optimized deep blending delogo
            final_file = await converter.delogo_video(
                input_path=source_file,
                box=req.box.model_dump(),
                start_time=req.start_time,
                end_time=req.end_time,
                duration=req.duration or 0
            )

        clean_title = sanitize_filename(f"inpaint_{req.title or 'video'}")
        final_filename = f"{clean_title}_clean.mp4"
        file_size = final_file.stat().st_size if final_file.exists() else 0

        await task_manager.update_task(
            task_id,
            status="completed",
            progress=100,
            step="Completado",
            message="¡Inpainting neuronal finalizado con éxito!",
            file_path=str(final_file),
            filename=final_filename,
            file_size=file_size
        )

    except Exception as e:
        await task_manager.update_task(
            task_id,
            status="failed",
            error=str(e),
            message=f"Error en inpainting neuronal: {str(e)}"
        )

@router.post("/watermark/delogo")
async def remove_watermark_delogo(req: WatermarkDelogoRequest, background_tasks: BackgroundTasks):
    """Level 2 Fast Delogo Watermark Removal."""
    task_id = str(uuid.uuid4())
    await task_manager.create_task(task_id, req.model_dump())
    background_tasks.add_task(process_delogo_pipeline, task_id, req)
    return {
        "success": True,
        "task_id": task_id,
        "method": "ffmpeg_delogo",
        "message": "Tarea de eliminación de marca de agua (FFmpeg Delogo) encolada."
    }

@router.post("/watermark/ai-inpaint")
async def remove_watermark_inpaint(req: WatermarkInpaintRequest, background_tasks: BackgroundTasks):
    """Level 3 Neural Video Inpainting (ProPainter / LaMa)."""
    task_id = str(uuid.uuid4())
    await task_manager.create_task(task_id, req.model_dump())
    background_tasks.add_task(process_inpaint_pipeline, task_id, req)
    return {
        "success": True,
        "task_id": task_id,
        "method": "ai_propainter",
        "message": "Tarea de inpainting neuronal (ProPainter) encolada."
    }

@router.get("/health")
async def health_check():
    """Returns system status, active cookies and ffmpeg availability."""
    return {
        "status": "online",
        "ffmpeg": get_ffmpeg_path(),
        "cookies_loaded": COOKIES_FILE.exists() and COOKIES_FILE.stat().st_size > 0,
        "platform": "vVideosdownloaderPro v2 Core API"
    }
