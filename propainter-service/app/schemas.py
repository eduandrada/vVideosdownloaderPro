from pydantic import BaseModel

class BBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class InpaintRequest(BaseModel):
    video_path: str       # Shared disk path or uploaded file
    bbox: BBox
    subvideo_length: int = 40
