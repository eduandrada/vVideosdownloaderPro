#!/bin/bash
mkdir -p /app/propainter_core/weights
cd /app/propainter_core/weights

# Descargar checkpoints oficiales
curl -L -o ProPainter.pth https://github.com/sczhou/ProPainter/releases/download/v0.1.0/ProPainter.pth
curl -L -o recurrent_flow_completion.pth https://github.com/sczhou/ProPainter/releases/download/v0.1.0/recurrent_flow_completion.pth
curl -L -o raft-things.pth https://github.com/sczhou/ProPainter/releases/download/v0.1.0/raft-things.pth
