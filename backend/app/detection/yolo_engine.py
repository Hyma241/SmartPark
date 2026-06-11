import os
import math
import torch
from ultralytics import YOLO

# PyTorch 2.6+ weights_only compatibility fix
try:
    import ultralytics.nn.tasks
    torch.serialization.add_safe_globals([ultralytics.nn.tasks.DetectionModel])
except (AttributeError, ImportError):
    pass


class YOLOEngine:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(YOLOEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def _initialize(self):
        if self._initialized:
            return

        # Search for yolov8x.pt in multiple locations so it works regardless of CWD
        model_name = "yolov8x.pt"
        this_dir = os.path.dirname(os.path.abspath(__file__))
        search_paths = [
            model_name,                                                        # CWD
            os.path.join(this_dir, "..", "..", model_name),                    # backend/
            os.path.join(this_dir, "..", "..", "..", model_name),              # project root
            os.path.join(this_dir, "..", "..", "..", "backend", model_name),   # explicit
        ]

        model_path = model_name  # default: let ultralytics download if not found
        for p in search_paths:
            resolved = os.path.normpath(p)
            if os.path.exists(resolved):
                model_path = resolved
                break

        print(f"[YOLO] Loading model: {model_path}")
        self.model = YOLO(model_path)

        # COCO class IDs: 2=car, 3=motorcycle, 5=bus, 7=truck
        self.vehicle_classes = [2, 3, 5, 7]
        self.class_names = {2: "car", 3: "motorcycle", 5: "bus", 7: "truck"}

        self._initialized = True
        print(f"[YOLO] Model loaded OK: {model_path}")

    def _deduplicate(self, detections, min_distance=15):
        """
        Remove truly duplicate detections (same vehicle detected twice by NMS miss).
        Uses 15px — small enough that adjacent cars in a parking lot are NOT merged.
        """
        if not detections:
            return detections

        sorted_dets = sorted(detections, key=lambda d: d["confidence"], reverse=True)
        kept = []
        for det in sorted_dets:
            cx, cy = det["center"]
            is_dup = any(
                math.sqrt((cx - k["center"][0]) ** 2 + (cy - k["center"][1]) ** 2) < min_distance
                for k in kept
            )
            if not is_dup:
                kept.append(det)

        removed = len(detections) - len(kept)
        if removed > 0:
            print(f"[YOLO] Dedup removed {removed} overlapping detections")
        return kept

    def _parse_results(self, results, deduplicate=True):
        """
        Parse YOLO output into detection dicts.
        We do NOT re-filter by a confidence threshold here — YOLO's `conf`
        parameter during inference already handles filtering.
        """
        detections = []
        for r in results:
            boxes = r.boxes
            if boxes is None:
                continue
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])

                if cls_id not in self.vehicle_classes:
                    continue  # safety check only

                track_id = int(box.id[0]) if box.id is not None else None

                detections.append({
                    "box": [int(x1), int(y1), int(x2), int(y2)],
                    "center": [int((x1 + x2) / 2), int((y1 + y2) / 2)],
                    "confidence": round(conf, 4),
                    "class_id": cls_id,
                    "class_name": self.class_names.get(cls_id, "vehicle"),
                    "track_id": track_id,
                })

        print(f"[YOLO] Raw detections: {len(detections)}")

        if deduplicate and detections:
            detections = self._deduplicate(detections)

        print(f"[YOLO] Final after dedup: {len(detections)}")
        for d in detections:
            print(f"  -> {d['class_name']} conf={d['confidence']:.0%} "
                  f"center={d['center']} track={d['track_id']}")
        return detections

    def detect(self, image):
        """
        Single-image detection — maximum accuracy.
        conf=0.05  → catches distant/small/partially-occluded vehicles
        imgsz=1280 → high resolution inference
        iou=0.45   → stricter NMS to avoid overlapping boxes
        """
        self._initialize()
        results = self.model(
            image,
            classes=self.vehicle_classes,
            conf=0.05,
            imgsz=1280,
            iou=0.45,
            agnostic_nms=True,
            verbose=False,
        )
        return self._parse_results(results, deduplicate=True)

    def track(self, image):
        """
        Video-frame tracking with ByteTrack for stable IDs across frames.
        conf=0.10  → slightly higher to reduce per-frame noise
        imgsz=1280 → maximum accuracy for video
        iou=0.45   → consistent with detect()
        """
        self._initialize()
        results = self.model.track(
            image,
            classes=self.vehicle_classes,
            conf=0.10,
            imgsz=1280,
            iou=0.45,
            agnostic_nms=True,
            persist=True,
            tracker="bytetrack.yaml",
            verbose=False,
        )
        return self._parse_results(results, deduplicate=False)


# Singleton — initialized lazily on first call to detect() or track()
yolo_engine = YOLOEngine()
