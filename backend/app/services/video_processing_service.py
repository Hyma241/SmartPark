import cv2
import uuid
import threading
import os
from typing import Dict, Any

from app.detection.yolo_engine import yolo_engine
from app.services.occupancy_service import occupancy_service
from app.utils.image_processing import draw_results


class VideoProcessingService:
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.output_dir = "uploads/videos"
        os.makedirs(self.output_dir, exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start_processing(self, input_path: str) -> str:
        task_id = str(uuid.uuid4())
        self.tasks[task_id] = {
            "status": "Queued",
            "progress": 0,
            "error": False,
            # video-specific results (raw numbers)
            "results": None,
            # SINGLE SOURCE OF TRUTH — same format as /detect/image response
            "statistics": None,
            "vehicles": None,
            "current_frame": 0,
            "total_frames": 0,
        }
        threading.Thread(
            target=self._process_video, args=(task_id, input_path), daemon=True
        ).start()
        print(f"[VideoService] Task {task_id} started for {input_path}")
        return task_id

    def get_progress(self, task_id: str) -> Dict[str, Any]:
        return self.tasks.get(task_id, {"error": True, "status": "Task not found"})

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _process_video(self, task_id: str, input_path: str):
        task = self.tasks[task_id]
        try:
            task["status"] = "Opening video..."
            task["progress"] = 2

            cap = cv2.VideoCapture(input_path)
            if not cap.isOpened():
                task["status"] = "Error: Cannot open video file"
                task["error"] = True
                return

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            task["total_frames"] = total_frames
            print(f"[VideoService] {width}x{height} @ {fps:.1f}fps, {total_frames} frames")

            output_path = os.path.join(self.output_dir, f"{task_id}.mp4")
            writer = self._open_writer(output_path, fps, width, height)
            if writer is None:
                task["status"] = "Error: Cannot create output video"
                task["error"] = True
                cap.release()
                return

            task["status"] = "Running YOLO detection & tracking..."

            # Tracking aggregates
            unique_ids: set = set()
            peak_occupied = 0
            occupancy_samples = []
            peak_cars = 0
            peak_motos = 0
            peak_trucks = 0
            max_frame_count = 0
            frame_index = 0
            processed_count = 0

            YOLO_EVERY_N = 3
            last_dets = []
            last_occ_status = {}
            last_stats = {}

            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                frame_index += 1

                if frame_index % YOLO_EVERY_N == 0:
                    dets = yolo_engine.track(frame)
                    occ_status = occupancy_service.calculate_occupancy(
                        dets, img_shape=frame.shape
                    )
                    stats = occupancy_service.get_statistics(occ_status, detections=dets)

                    # Unique vehicle tracking
                    for d in dets:
                        tid = d.get("track_id")
                        if tid is not None:
                            unique_ids.add(tid)

                    # Per-frame class counts (track peaks)
                    f_cars   = sum(1 for d in dets if d["class_name"] == "car")
                    f_motos  = sum(1 for d in dets if d["class_name"] == "motorcycle")
                    f_trucks = sum(1 for d in dets if d["class_name"] in ("bus", "truck"))
                    peak_cars   = max(peak_cars,   f_cars)
                    peak_motos  = max(peak_motos,  f_motos)
                    peak_trucks = max(peak_trucks, f_trucks)
                    max_frame_count = max(max_frame_count, len(dets))

                    occ_now = stats.get("Occupied", 0)
                    peak_occupied = max(peak_occupied, occ_now)
                    occupancy_samples.append(occ_now)
                    processed_count += 1

                    last_dets = dets
                    last_occ_status = occ_status
                    last_stats = stats

                # Draw bounding boxes + slot overlays on EVERY frame
                annotated = draw_results(
                    frame, last_dets, last_occ_status,
                    occupancy_service._scale_slots(frame.shape)
                )
                writer.write(annotated)

                if frame_index % 30 == 0:
                    prog = 5 + int((frame_index / max(total_frames, 1)) * 85)
                    task["progress"] = min(prog, 90)
                    task["current_frame"] = frame_index
                    task["status"] = f"Processing frame {frame_index}/{total_frames}..."

            cap.release()
            writer.release()

            # ── Build SINGLE SOURCE OF TRUTH ───────────────────────────────
            avg_occupied = (
                round(sum(occupancy_samples) / len(occupancy_samples), 1)
                if occupancy_samples else 0
            )
            total_unique = len(unique_ids) if unique_ids else max_frame_count

            # statistics dict — IDENTICAL format to what /detect/image returns
            # so all frontend pages can read statistics['Occupied'] etc. directly
            last_total_slots = last_stats.get("Total Slots", 0)
            final_stats = {
                "Mode": last_stats.get("Mode", "Estimated Capacity"),
                "Total Slots": last_total_slots,
                "Occupied": peak_occupied,
                "Available": max(0, last_total_slots - peak_occupied),
                "Occupancy Rate": (
                    f"{int(peak_occupied / last_total_slots * 100)}%"
                    if last_total_slots > 0 else "0%"
                ),
            }
            final_vehicles = {
                "total": total_unique,
                "cars": peak_cars,
                "motorcycles": peak_motos,
                "trucks": peak_trucks,
            }

            task["results"] = {
                "Total Vehicles Detected": total_unique,
                "Peak Occupancy": peak_occupied,
                "Average Occupancy": avg_occupied,
                "Total Frames Processed": frame_index,
                "YOLO Frames Analysed": processed_count,
                "Output Video URL": f"/api/detect/video/download/{task_id}",
            }
            task["statistics"] = final_stats    # same keys as image detection
            task["vehicles"] = final_vehicles   # same keys as image detection
            task["status"] = "Completed"
            task["progress"] = 100
            print(f"[VideoService] DONE. stats={final_stats} | vehicles={final_vehicles}")

            # Push demo video results to global stats
            import sys
            if "app.api.endpoints" in sys.modules:
                ep = sys.modules["app.api.endpoints"]
                if hasattr(ep, "update_global_stats"):
                    ep.update_global_stats("demo_video", final_stats, final_vehicles, user_id="")

        except Exception as exc:
            import traceback
            traceback.print_exc()
            task["status"] = f"Error: {exc}"
            task["error"] = True

    def _open_writer(self, path, fps, width, height):
        for codec in ("avc1", "H264", "mp4v"):
            try:
                fourcc = cv2.VideoWriter_fourcc(*codec)
                w = cv2.VideoWriter(path, fourcc, fps, (width, height))
                if w.isOpened():
                    print(f"[VideoService] Codec: {codec}")
                    return w
                w.release()
            except Exception:
                pass
        return None


video_service = VideoProcessingService()
