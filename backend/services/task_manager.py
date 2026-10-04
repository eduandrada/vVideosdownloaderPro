import asyncio
import os
import time
from typing import Dict, Any, Optional, AsyncGenerator
from pathlib import Path
from config import TEMP_DIR, FILE_TTL_SECONDS

class TaskManager:
    def __init__(self):
        self._tasks: Dict[str, Dict[str, Any]] = {}
        self._listeners: Dict[str, list[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()

    async def create_task(self, task_id: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            task = {
                "id": task_id,
                "status": "queued", # queued, analyzing, downloading, transcoding, completed, failed
                "progress": 0,
                "speed": "",
                "eta": "",
                "step": "Encolado",
                "message": "Iniciando proceso...",
                "file_path": None,
                "filename": None,
                "file_size": 0,
                "content_type": "application/octet-stream",
                "created_at": time.time(),
                "error": None,
                "metadata": metadata
            }
            self._tasks[task_id] = task
            self._listeners[task_id] = []
            return task

    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self._tasks.get(task_id)

    async def update_task(self, task_id: str, **kwargs) -> Optional[Dict[str, Any]]:
        async with self._lock:
            task = self._tasks.get(task_id)
            if not task:
                return None
            for key, val in kwargs.items():
                task[key] = val

            # Broadcast to SSE listeners
            if task_id in self._listeners:
                snapshot = dict(task)
                for q in self._listeners[task_id]:
                    await q.put(snapshot)
            return task

    async def subscribe(self, task_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        q = asyncio.Queue()
        async with self._lock:
            if task_id not in self._tasks:
                yield {"status": "not_found", "progress": 0, "message": "Tarea no encontrada"}
                return
            
            # send initial state
            await q.put(dict(self._tasks[task_id]))
            if task_id not in self._listeners:
                self._listeners[task_id] = []
            self._listeners[task_id].append(q)

        try:
            while True:
                data = await q.get()
                yield data
                if data.get("status") in ("completed", "failed"):
                    break
        finally:
            async with self._lock:
                if task_id in self._listeners and q in self._listeners[task_id]:
                    self._listeners[task_id].remove(q)

    async def cleanup_expired_files(self):
        """Scans TEMP_DIR and removes files older than FILE_TTL_SECONDS."""
        now = time.time()
        try:
            for item in TEMP_DIR.glob("*"):
                if item.is_file():
                    age = now - item.stat().st_mtime
                    if age > FILE_TTL_SECONDS:
                        try:
                            item.unlink(missing_ok=True)
                        except Exception:
                            pass
            
            # Also cleanup task dictionary
            async with self._lock:
                expired = [
                    tid for tid, t in self._tasks.items()
                    if now - t["created_at"] > (FILE_TTL_SECONDS + 300)
                ]
                for tid in expired:
                    del self._tasks[tid]
                    if tid in self._listeners:
                        del self._listeners[tid]
        except Exception as e:
            print(f"Error in cleanup: {e}")

task_manager = TaskManager()
