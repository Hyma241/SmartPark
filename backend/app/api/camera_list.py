from fastapi import APIRouter
from app.services.stream_manager import stream_manager

router = APIRouter()

@router.get("/cameras/list")
def get_camera_list(user_id: str = ""):
    """Return a simplified list of cameras (id, name, location, status)."""
    status = stream_manager.get_status()
    cameras = []
    for cam_id, info in status.items():
        if user_id and info.get("user_id") != user_id:
            continue
        cameras.append({
            "id": cam_id,
            "name": info.get("name", ""),
            "location": info.get("location", ""),
            "status": info.get("status", "offline")
        })
    return {"cameras": cameras}
