FROM pytorch/pytorch:2.1.2-cuda11.8-cudnn8-runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Instalar FFmpeg, git y dependencias del sistema para OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clonar el core de ProPainter
RUN git clone https://github.com/sczhou/ProPainter.git /app/propainter_core

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Descargar pesos preentrenados
COPY download_weights.sh .
RUN chmod +x download_weights.sh && ./download_weights.sh

COPY ./app /app/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
