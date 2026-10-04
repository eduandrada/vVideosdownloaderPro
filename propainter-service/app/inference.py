import sys
import subprocess
import os

PROPAINTER_ROOT = "/app/propainter_core"

def run_propainter_inference(frames_dir: str, masks_dir: str, output_dir: str, subvideo_len: int = 40):
    """
    Ejecuta el script oficial de inferencia optimizado para bajo consumo de VRAM.
    """
    cmd = [
        sys.executable,
        f"{PROPAINTER_ROOT}/inference_propainter.py",
        "--video", frames_dir,
        "--mask", masks_dir,
        "--output", output_dir,
        "--subvideo_length", str(subvideo_len),
        "--neighbor_length", "10",
        "--fp16" # Clave para reducir el uso de VRAM a la mitad
    ]

    env = os.environ.copy()
    env["PYTHONPATH"] = f"{PROPAINTER_ROOT}:{env.get('PYTHONPATH', '')}"

    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Fallo en ProPainter: {result.stderr}")

    # ProPainter guarda el resultado en [output_dir]/inpaint_out
    return os.path.join(output_dir, "inpaint_out")
