import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.download import router as download_router
from services.task_manager import task_manager
from config import ALLOWED_ORIGINS

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn periodic temp cleaner task
    async def periodic_cleanup():
        while True:
            await asyncio.sleep(300) # every 5 minutes
            await task_manager.cleanup_expired_files()

    cleanup_task = asyncio.create_task(periodic_cleanup())
    yield
    # Shutdown
    cleanup_task.cancel()

app = FastAPI(
    title="vVideosdownloaderPro v2 API",
    description="Motor multimedia de alto rendimiento para descarga, transcodificación FFmpeg y eliminación de marcas de agua. Desarrollado por Eduardo Andrada / Catamarca.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend and direct browser access
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(download_router)

from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Always answer with JSON so the frontend can show a readable message."""
    import re as _re
    msg = _re.sub(r'^(ERROR:\s*(\[[^\]]+\]\s*)?)+', '', str(exc)).strip() or exc.__class__.__name__
    return JSONResponse(
        status_code=500,
        content={"detail": f"Error interno del motor: {msg[:400]}"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Credentials": "true",
        },
    )

@app.get("/")
def read_root():
    return {
        "service": "vVideosdownloaderPro v2 Media Engine",
        "developer": "Eduardo Andrada / Catamarca",
        "status": "active",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
