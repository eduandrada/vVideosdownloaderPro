import os
import subprocess
import cv2
import numpy as np

def extract_video_assets(video_path: str, work_dir: str):
    """Extrae frames y conserva el audio intacto."""
    frames_dir = os.path.join(work_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    audio_path = os.path.join(work_dir, "audio.aac")

    # 1. Extraer audio sin recodificar
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path, "-vn", "-c:a", "copy", audio_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # 2. Extraer frames numerados con resolución original
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path, "-q:v", "2",
        f"{frames_dir}/%05d.png"
    ], check=True)

    # Obtener FPS nativos
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.release()

    return frames_dir, audio_path, fps

def generate_bbox_masks(frames_dir: str, work_dir: str, bbox: dict):
    """
    Crea las máscaras binarias a partir de coordenadas {x, y, w, h}.
    Aplica una ligera dilatación para asegurar que los bordes del logo queden cubiertos.
    """
    masks_dir = os.path.join(work_dir, "masks")
    os.makedirs(masks_dir, exist_ok=True)

    frame_files = sorted(os.listdir(frames_dir))
    if not frame_files:
        raise ValueError("No se encontraron frames extraídos.")

    sample_frame = cv2.imread(os.path.join(frames_dir, frame_files[0]))
    h_img, w_img = sample_frame.shape[:2]

    # Crear máscara base con el bounding box
    mask = np.zeros((h_img, w_img), dtype=np.uint8)
    x, y, w, h = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
    
    # Boundary clamps
    x = max(0, min(x, w_img - 1))
    y = max(0, min(y, h_img - 1))
    w = max(1, min(w, w_img - x))
    h = max(1, min(h, h_img - y))
    
    mask[y : y + h, x : x + w] = 255

    # Dilatar 5px para absorber rebordes o antialiasing de la marca
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    mask = cv2.dilate(mask, kernel, iterations=1)

    for f_name in frame_files:
        cv2.imwrite(os.path.join(masks_dir, f_name), mask)

    return masks_dir

def remux_video(inpainted_frames_dir: str, audio_path: str, output_path: str, fps: float):
    """Combina los frames procesados con el audio original en un MP4 H.264."""
    cmd = [
        "ffmpeg", "-y",
        "-r", str(fps),
        "-i", f"{inpainted_frames_dir}/%05d.png",
    ]

    if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
        cmd.extend(["-i", audio_path, "-c:a", "aac"])
    
    cmd.extend([
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "18",
        "-preset", "fast",
        output_path
    ])
    subprocess.run(cmd, check=True)
