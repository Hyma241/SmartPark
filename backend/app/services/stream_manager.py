import cv2
import threading
import os
import time
import base64
import sys
import json
import numpy as np

try:
    import yt_dlp
    HAS_YTDLP = True
    YTDLP_VERSION = yt_dlp.version.__version__
except ImportError:
    HAS_YTDLP = False
    YTDLP_VERSION = "None"
    print("[StreamManager] WARNING: yt-dlp not installed. YouTube Live URLs will not work.")

from app.detection.yolo_engine import yolo_engine
from app.services.occupancy_service import occupancy_service
from app.services.firebase_service import firebase_service


class StreamManager:
    def __init__(self):
        self.active_streams = {}
        self.threads = {}
        self.stop_events = {}
        self.cameras_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "uploads", "cameras.json")
        self._load_persisted_cameras()

    def _save_persisted_cameras(self):
        data = {}
        for cam_id, info in self.active_streams.items():
            data[cam_id] = {
                "url": info.get("original_url", info["url"]),
                "name": info.get("name", "Camera"),
                "location": info.get("location", ""),
                "user_id": info.get("user_id", "")
            }
        try:
            os.makedirs(os.path.dirname(self.cameras_file), exist_ok=True)
            with open(self.cameras_file, "w") as f:
                json.dump(data, f)
            print(f"[StreamManager] Saved {len(data)} cameras to disk.")
        except Exception as e:
            print(f"[StreamManager] Failed to persist cameras: {e}")

    def _load_persisted_cameras(self):
        if os.path.exists(self.cameras_file):
            try:
                with open(self.cameras_file, "r") as f:
                    data = json.load(f)
                for cam_id, info in data.items():
                    print(f"[StreamManager] Reloading persisted camera: {cam_id}")
                    self.add_camera(cam_id, info["url"], info.get("location", ""), info.get("name", "Camera"), info.get("user_id", ""))
            except Exception as e:
                print(f"[StreamManager] Failed to load persisted cameras: {e}")

    def resolve_stream(self, url: str) -> dict:
        if not url:
            return {"success": False, "url": url, "error": "Empty URL"}
        if "youtube.com" in url or "youtu.be" in url:
            return self._resolve_youtube(url)
        return {"success": True, "url": url, "error": None}

    def _resolve_youtube(self, url: str) -> dict:
        if not HAS_YTDLP:
            return {"success": False, "url": None, "error": "yt-dlp is not installed on the server"}

        print(f"[StreamManager] Resolving YouTube URL: {url} | yt-dlp version: {YTDLP_VERSION}")

        format_strategies = [
            "best[ext=mp4][height<=720]",
            "best[ext=mp4]",
            "best[height<=720]",
            "best",
        ]

        last_error = None
        for fmt in format_strategies:
            try:
                ydl_opts = {
                    "quiet": True,
                    "no_warnings": True,
                    "format": fmt,
                    "socket_timeout": 10,
                    "extractor_retries": 1,
                }
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=False)

                    manifest = info.get("manifest_url")
                    if manifest:
                        print(f"[StreamManager] Extracted HLS manifest (fmt={fmt})")
                        return {"success": True, "url": manifest, "error": None}

                    direct = info.get("url")
                    if direct:
                        print(f"[StreamManager] Extracted Direct URL (fmt={fmt})")
                        return {"success": True, "url": direct, "error": None}

                    for f in reversed(info.get("formats", [])):
                        furl = f.get("url")
                        if furl and f.get("ext") in ("mp4", "ts"):
                            return {"success": True, "url": furl, "error": None}

                    fmts = info.get("formats", [])
                    if fmts and fmts[-1].get("url"):
                        return {"success": True, "url": fmts[-1]["url"], "error": None}

            except Exception as e:
                last_error = str(e)
                print(f"[StreamManager] Format '{fmt}' extraction failed: {e}")
                continue

        error_msg = f"yt-dlp extraction failed. Last error: {last_error}"
        print(f"[StreamManager] {error_msg}")
        return {"success": False, "url": None, "error": error_msg}

    def test_stream(self, url: str) -> dict:
        print(f"[StreamManager] Testing incoming URL: {url}")
        
        is_youtube = "youtube.com" in url or "youtu.be" in url
        print(f"[StreamManager] URL type detected: {'YouTube' if is_youtube else 'Direct/RTSP'}")
        
        resolution_result = self.resolve_stream(url)
        
        if not resolution_result["success"]:
            return {
                "success": False,
                "message": "yt-dlp extraction failed",
                "error": resolution_result["error"],
                "resolved_url": None
            }
            
        resolved_url = resolution_result["url"]
        print(f"[StreamManager] Extracted stream URL: {resolved_url[:100]}...")

        cap = None
        open_error = None
        for backend in (cv2.CAP_FFMPEG, cv2.CAP_ANY):
            try:
                c = cv2.VideoCapture(resolved_url, backend)
                c.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                if c.isOpened():
                    cap = c
                    print(f"[StreamManager] OpenCV opened successfully with backend: {backend}")
                    break
                else:
                    open_error = "cv2.VideoCapture returned False"
                c.release()
            except Exception as e:
                open_error = str(e)

        if cap is None or not cap.isOpened():
            return {
                "success": False,
                "message": "OpenCV could not connect to the resolved stream",
                "error": f"OpenCV open result: {open_error}",
                "resolved_url": resolved_url if is_youtube else None,
            }

        ret, frame = cap.read()
        cap.release()

        if not ret or frame is None:
            return {
                "success": False,
                "message": "Stream opened but no frames received — stream may be offline or private",
                "resolved_url": resolved_url if is_youtube else None,
            }

        h, w = frame.shape[:2]
        preview_w = 320
        preview_h = int(preview_w * h / w)
        preview = cv2.resize(frame, (preview_w, preview_h))
        _, buf = cv2.imencode(".jpg", preview, [cv2.IMWRITE_JPEG_QUALITY, 70])
        frame_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('utf-8')}"

        return {
            "success": True,
            "message": f"Connected — {w}×{h}",
            "resolution": f"{w}x{h}",
            "frame_preview": frame_b64,
            "resolved_url": resolved_url if is_youtube else None,
        }

    def add_camera(self, cam_id: str, stream_url: str, location: str = "", name: str = "", user_id: str = ""):
        if cam_id in self.active_streams:
            return False, "Camera ID already active"

        res = self.resolve_stream(stream_url)
        if not res["success"]:
            return False, f"Failed to resolve URL: {res['error']}"
            
        resolved_url = res["url"]
        
        stop_event = threading.Event()
        thread = threading.Thread(
            target=self._process_stream,
            args=(cam_id, stream_url, resolved_url, location, stop_event),
            daemon=True,
        )
        self.active_streams[cam_id] = {
            "url": resolved_url,
            "original_url": stream_url,
            "location": location,
            "name": name,
            "user_id": user_id,
            "status": "starting",
            "last_frame": None,
            "last_stats": None,
            "stop_event": stop_event
        }
        self._save_persisted_cameras()
        thread.start()
        print(f"[StreamManager] Camera '{cam_id}' started.")
        return True, "Camera connected successfully"

    def remove_camera(self, cam_id: str) -> bool:
        if cam_id in self.active_streams:
            self.active_streams[cam_id]["stop_event"].set()
            del self.active_streams[cam_id]
            self._save_persisted_cameras()
            return True
        return False

    def get_status(self) -> dict:
        return {
            cam_id: {
                "url": info["url"],
                "original_url": info.get("original_url", info["url"]),
                "location": info.get("location", ""),
                "name": info.get("name", "Camera"),
                "status": info["status"],
                "user_id": info.get("user_id", ""),
            }
            for cam_id, info in self.active_streams.items()
        }

    def _process_stream(self, cam_id, original_url, resolved_url, location, stop_event):
        cap = cv2.VideoCapture(resolved_url)
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        processing_interval = 1.5
        reconnect_wait = 10

        while not stop_event.is_set():
            t0 = time.time()
            ret, frame = cap.read()

            if not ret:
                self.active_streams[cam_id]["status"] = "Reconnecting..."
                print(f"[StreamManager] Lost '{cam_id}', reconnecting in {reconnect_wait}s")
                cap.release()
                stop_event.wait(timeout=reconnect_wait)
                if stop_event.is_set():
                    break
                res = self.resolve_stream(original_url)
                if res["success"]:
                    new_url = res["url"]
                    self.active_streams[cam_id]["resolved_url"] = new_url
                    cap = cv2.VideoCapture(new_url)
                continue

            self.active_streams[cam_id]["status"] = "Connected"
            self.active_streams[cam_id]["last_seen"] = time.time()

            try:
                dets = yolo_engine.track(frame)
                occ_status = occupancy_service.calculate_occupancy(dets, img_shape=frame.shape)
                stats = occupancy_service.get_statistics(occ_status, detections=dets)
                
                if location:
                    stats["location"] = location

                vehicles = {
                    "total": len(dets),
                    "cars": sum(1 for d in dets if d["class_name"] == "car"),
                    "motorcycles": sum(1 for d in dets if d["class_name"] == "motorcycle"),
                    "trucks": sum(1 for d in dets if d["class_name"] in ("bus", "truck")),
                }
                
                # Update Firebase (optional)
                firebase_service.update_occupancy(stats, vehicles, cam_id)
                
                # Dynamically update the global state in endpoints so ALL frontends see this LIVE
                if "app.api.endpoints" in sys.modules:
                    ep = sys.modules["app.api.endpoints"]
                    if hasattr(ep, "update_global_stats"):
                        ep.update_global_stats(cam_id, stats, vehicles, self.active_streams[cam_id].get("user_id", ""))
                        
            except Exception as e:
                import traceback
                print(f"[StreamManager] Detection error '{cam_id}': {e}")
                traceback.print_exc()

            sleep_for = max(0.0, processing_interval - (time.time() - t0))
            if sleep_for > 0:
                stop_event.wait(timeout=sleep_for)

        cap.release()
        print(f"[StreamManager] Stream '{cam_id}' stopped.")

stream_manager = StreamManager()
