import cv2
import time
import os
import tempfile

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any, Dict, Optional

from app.detection.yolo_engine import yolo_engine
from app.services.occupancy_service import occupancy_service
from app.services.stream_manager import stream_manager
from app.services.video_processing_service import video_service
from app.utils.image_processing import draw_results, encode_image_base64, decode_image_bytes

router = APIRouter()

# Global state updated ONLY by live camera streams (stream_manager)
# Keyed by user_id
latest_statistics: Dict[str, Dict[str, Any]] = {}
camera_stats: Dict[str, Dict[str, Dict[str, Any]]] = {}
latest_vehicle_counts: Dict[str, Dict[str, Any]] = {}

def update_global_stats(cam_id: str, stats: dict, vehicles: dict, user_id: str = ""):
    global latest_statistics, latest_vehicle_counts, camera_stats
    if user_id not in camera_stats:
        camera_stats[user_id] = {}
    camera_stats[user_id][cam_id] = stats
    
    latest_statistics[user_id] = stats
    latest_vehicle_counts[user_id] = vehicles

# ── Image Detection ────────────────────────────────────────────────────────────

@router.post("/detect/image")
async def detect_image(file: UploadFile = File(...)):
    t0 = time.time()
    contents = await file.read()
    image = decode_image_bytes(contents)

    if image is None:
        return {"success": False, "error": "Could not decode image"}

    print(f"[API] detect/image — shape={image.shape}")

    detections = yolo_engine.detect(image)
    occupancy_status = occupancy_service.calculate_occupancy(detections, img_shape=image.shape)
    stats = occupancy_service.get_statistics(occupancy_status, detections=detections)

    total = len(detections)
    vehicle_counts = {
        "total": total,
        "cars": sum(1 for d in detections if d["class_name"] == "car"),
        "motorcycles": sum(1 for d in detections if d["class_name"] == "motorcycle"),
        "trucks": sum(1 for d in detections if d["class_name"] in ("bus", "truck")),
    }

    result_img = draw_results(
        image, detections, occupancy_status,
        occupancy_service._scale_slots(image.shape)
    )
    img_b64 = encode_image_base64(result_img)

    elapsed = time.time() - t0
    avg_conf = (sum(d["confidence"] for d in detections) / total) if total > 0 else 0

    print(f"[API] detect/image — {total} vehicles | mode={stats['Mode']} | "
          f"occupied={stats['Occupied']} | available={stats['Available']} | "
          f"avg_conf={avg_conf:.0%} | time={elapsed:.2f}s")

    # Update global stats with a demo camera ID so it shows in Public Preview
    update_global_stats("demo_image", stats, vehicle_counts, user_id="")

    return {
        "success": True,
        "statistics": stats,
        "vehicles": vehicle_counts,
        "metrics": {
            "Processing FPS": round(1.0 / elapsed, 1) if elapsed > 0 else 0,
            "Average Confidence": f"{int(avg_conf * 100)}%",
            "Total Detections": total,
        },
        "image_data": img_b64,
    }


# ── Video Detection ────────────────────────────────────────────────────────────

@router.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    original_name = file.filename or "upload.mp4"
    suffix = os.path.splitext(original_name)[-1] or ".mp4"

    fd, temp_path = tempfile.mkstemp(suffix=suffix)
    with os.fdopen(fd, "wb") as f:
        content = await file.read()
        f.write(content)

    print(f"[API] detect/video — {len(content)} bytes saved to {temp_path}")
    task_id = video_service.start_processing(temp_path)
    return {"success": True, "task_id": task_id, "message": "Video processing started"}


@router.get("/detect/video/progress/{task_id}")
def video_progress(task_id: str):
    return video_service.get_progress(task_id)


@router.get("/detect/video/download/{task_id}")
def download_video(task_id: str):
    path = os.path.join(video_service.output_dir, f"{task_id}.mp4")
    if os.path.exists(path):
        return FileResponse(path, media_type="video/mp4", filename="smartpark_processed.mp4")
    return {"error": "Processed video not found — still processing?"}


# ── Live Statistics ────────────────────────────────────────────────────────────

@router.get("/parking/statistics")
def get_statistics(user_id: str = ""):
    # Aggregate per‑camera stats into a zones list for the specific user
    user_cams = camera_stats.get(user_id, {})
    if not user_cams:
        return {
            "Mode": "No Camera",
            "Total Slots": 0,
            "Occupied": 0,
            "Available": 0,
            "Occupancy Rate": "0%",
            "zones": []
        }
    zones = []
    total_slots = 0
    occupied = 0
    for cam_id, stats in user_cams.items():
        zones.append(stats)
        total_slots += int(stats.get("Total Slots", 0))
        occupied += int(stats.get("Occupied", 0))
    available = max(total_slots - occupied, 0)
    occupancy_rate = f"{int((occupied/total_slots)*100) if total_slots else 0}%"
    latest_stat = latest_statistics.get(user_id, {})
    aggregated = {
        "Mode": latest_stat.get("Mode", "Estimated Capacity"),
        "Total Slots": total_slots,
        "Occupied": occupied,
        "Available": available,
        "Occupancy Rate": occupancy_rate,
        "zones": zones,
    }
    return aggregated


@router.get("/vehicles/count")
def get_vehicles_count(user_id: str = ""):
    if user_id not in latest_vehicle_counts:
        return {
            "total": 0,
            "cars": 0,
            "motorcycles": 0,
            "trucks": 0
        }
    return latest_vehicle_counts[user_id]


# ── Camera Management ──────────────────────────────────────────────────────────

class TestCameraConfig(BaseModel):
    url: str


class CameraConfig(BaseModel):
    cam_id: str
    url: str
    name: str
    location: Optional[str] = None
    user_id: Optional[str] = ""


@router.post("/cameras/test")
def test_camera(config: TestCameraConfig):
    """
    Test stream connectivity.
    Supports: RTSP, HTTP, HTTPS, YouTube Live (via yt-dlp).
    Returns success, message, resolution, and frame_preview (base64 JPEG).
    """
    url = config.url.strip()
    if not url:
        return {"success": False, "message": "No URL provided"}

    print(f"[API] cameras/test — url={url}")
    result = stream_manager.test_stream(url)
    print(f"[API] cameras/test — success={result['success']} msg={result.get('message')}")
    return result


@router.post("/cameras/add")
def add_camera(config: CameraConfig):
    # Pass the camera name as well so it is stored in the manager
    success, msg = stream_manager.add_camera(config.cam_id, config.url, config.location, config.name, config.user_id)
    return {"success": success, "message": msg}


@router.delete("/cameras/{cam_id}")
def remove_camera(cam_id: str, user_id: str = ""):
    success = stream_manager.remove_camera(cam_id)
    if success:
        global camera_stats
        for uid in camera_stats:
            if cam_id in camera_stats[uid]:
                del camera_stats[uid][cam_id]
    return {"success": success}


@router.get("/cameras/status")
def camera_status(user_id: str = ""):
    status = stream_manager.get_status()
    if user_id:
        return {k: v for k, v in status.items() if v.get("user_id") == user_id}
    return status


# ── Layout ─────────────────────────────────────────────────────────────────────

class LayoutConfig(BaseModel):
    slots: list


@router.post("/layout/save")
def save_layout(config: LayoutConfig):
    try:
        occupancy_service.update_slots(config.slots)
        return {"success": True, "message": f"Saved {len(config.slots)} slots"}
    except Exception as e:
        return {"success": False, "message": str(e)}


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "version": "2.3.0",
        "slots_configured": len(occupancy_service.slots),
        "active_cameras": len(stream_manager.active_streams),
    }
