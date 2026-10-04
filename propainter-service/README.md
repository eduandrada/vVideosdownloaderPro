# Microservicio ProPainter Video Inpainting (GPU Production)

Este microservicio empaqueta el pipeline completo de **ProPainter (Flow-Guided Video Inpainting)** en un contenedor Docker con aceleración CUDA, API FastAPI y orquestación con FFmpeg.

---

## 1. Compilación y Ejecución

```bash
# 1. Compilar imagen Docker con CUDA 11.8 / PyTorch
docker build -t propainter-service:latest .

# 2. Ejecutar con acceso a GPU NVIDIA y memoria compartida extendida (shm-size)
docker run -d --gpus all \
  --name propainter_api \
  --shm-size=8g \
  -p 8001:8000 \
  -v $(pwd)/storage:/tmp \
  propainter-service:latest
```

---

## 2. Parámetros Críticos y Optimización de VRAM

- **Flag `--fp16`:** Activa Half Precision; reduce el consumo de VRAM en un ~45% sin degradación visual.
- **Ajuste de `subvideo_length`:**
  - **GPU 8 GB (RTX 3070 / 4060):** `subvideo_length = 20` o `25`.
  - **GPU 16 GB (T4 / V100 / L4):** `subvideo_length = 40` o `50` (óptimo para coherencia temporal).
  - **GPU 24 GB+ (A10G / RTX 4090 / A100):** `subvideo_length = 80`.
- **Resolución:** Si el video ingresa en 4K, reescala los frames a 1080p o 720p antes de pasarlos a ProPainter, y reescala el resultado; el inpainting neuronal sobre 4K nativo saturará cualquier GPU comercial.
