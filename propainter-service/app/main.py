import shutil
import uuid
from fastapi import FastAPI, BackgroundTasks, HTTPException
from app.schemas import InpaintRequest
from app.pipeline import extract_video_assets, generate_bbox_masks, remux_video
from app.inference import run_propainter_inference

app = FastAPI(title="ProPainter Inpainting API")

TASKS = {}

def process_inpainting_job(task_id: str, req: InpaintRequest):
    work_dir = f"/tmp/{task_id}"
    try:
        TASKS[task_id]["status"] = "extracting_frames"
        frames_dir, audio_path, fps = extract_video_assets(req.video_path, work_dir)

        TASKS[task_id]["status"] = "generating_masks"
        masks_dir = generate_bbox_masks(frames_dir, work_dir, req.bbox.model_dump())

        TASKS[task_id]["status"] = "running_inpainting"
        out_raw_dir = f"{work_dir}/output"
        inpainted_frames = run_propainter_inference(
            frames_dir, masks_dir, out_raw_dir, req.subvideo_length
        )

        TASKS[task_id]["status"] = "muxing_final_video"
        final_video = f"/tmp/{task_id}_clean.mp4"
        remux_video(inpainted_frames, audio_path, final_video, fps)

        TASKS[task_id]["status"] = "completed"
        TASKS[task_id]["result_path"] = final_video
    except Exception as e:
        TASKS[task_id]["status"] = "failed"
        TASKS[task_id]["error"] = str(e)
    finally:
        # Limpiar frames intermediarios para no saturar disco
        shutil.rmtree(work_dir, ignore_errors=True)

@app.post("/api/v1/inpaint")
def create_inpaint_job(req: InpaintRequest, bg_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    TASKS[task_id] = {"status": "queued", "result_path": None, "error": None}
    bg_tasks.add_task(process_inpainting_job, task_id, req)
    return {"task_id": task_id, "status": "queued"}

@app.get("/api/v1/status/{task_id}")
def get_status(task_id: str):
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return TASKS[task_id]

@app.get("/health")
def health():
    return {"status": "ready", "service": "ProPainter Inpainting Worker"}
