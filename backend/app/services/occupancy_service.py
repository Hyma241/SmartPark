import numpy as np
from shapely.geometry import Polygon, box as shapely_box


class OccupancyService:
    def __init__(self):
        self.slots = {}
        # Match yolo_engine's conf=0.15 threshold
        self.min_confidence = 0.10
        # 25% overlap to mark a slot occupied
        self.iou_threshold = 0.25

    # ------------------------------------------------------------------
    # Slot Management
    # ------------------------------------------------------------------

    def update_slots(self, slots_data):
        new_slots = {}
        for i, slot in enumerate(slots_data):
            if isinstance(slot, dict):
                slot_id = slot.get("id", f"S{i + 1}")
                points = slot.get("points", [])
            else:
                slot_id = f"S{i + 1}"
                points = slot
            new_slots[slot_id] = [(int(p[0]), int(p[1])) for p in points]
        self.slots = new_slots
        print(f"[Occupancy] Updated layout: {len(new_slots)} slots")

    def _scale_slots(self, img_shape):
        """Scale slot coordinates from the 640×480 drawing canvas to actual image size."""
        if img_shape is None or not self.slots:
            return self.slots
        h, w = img_shape[:2]
        if w == 640 and h == 480:
            return self.slots
        scale_x = w / 640.0
        scale_y = h / 480.0
        return {
            sid: [(int(p[0] * scale_x), int(p[1] * scale_y)) for p in poly]
            for sid, poly in self.slots.items()
        }

    # ------------------------------------------------------------------
    # Occupancy Calculation
    # ------------------------------------------------------------------

    def calculate_occupancy(self, detections, img_shape=None):
        """
        Map vehicle detections → parking slots via polygon IoU.
        GREEN = AVAILABLE,  RED = OCCUPIED.
        Returns {} if no slots configured (→ triggers Estimated Capacity Mode).
        """
        if not self.slots:
            return {}

        status = {sid: "Available" for sid in self.slots}
        slots = self._scale_slots(img_shape)

        # Pre-build Shapely polygons
        slot_polys = {}
        for sid, coords in slots.items():
            if len(coords) >= 3:
                try:
                    p = Polygon(coords)
                    if p.is_valid and p.area > 0:
                        slot_polys[sid] = p
                except Exception:
                    pass

        for det in detections:
            if det.get("confidence", 0) < self.min_confidence:
                continue
            x1, y1, x2, y2 = det["box"]
            car_poly = shapely_box(x1, y1, x2, y2)
            car_area = car_poly.area
            if car_area <= 0:
                continue

            best_overlap, best_slot = 0, None
            for sid, slot_poly in slot_polys.items():
                if status[sid] == "Occupied":
                    continue
                intersection = car_poly.intersection(slot_poly).area
                if intersection <= 0:
                    continue
                # Use max of (intersection/car_area) and IoU
                overlap_car = intersection / car_area
                union = car_poly.union(slot_poly).area
                iou = intersection / union if union > 0 else 0
                overlap = max(overlap_car, iou)
                if overlap >= self.iou_threshold and overlap > best_overlap:
                    best_overlap = overlap
                    best_slot = sid

            if best_slot:
                status[best_slot] = "Occupied"

        occupied = sum(1 for v in status.values() if v == "Occupied")
        print(f"[Occupancy] Total={len(status)}, Occupied={occupied}, Available={len(status)-occupied}")
        return status

    # ------------------------------------------------------------------
    # Statistics
    # ------------------------------------------------------------------

    def get_statistics(self, occupancy_status, detections=None):
        """
        Build the statistics dict that ALL frontend pages will use.
        INVARIANT: Occupied + Available == Total Slots (always).

        SLOT MODE: triggered when parking slots are configured.
        ESTIMATED CAPACITY MODE: triggered when no slots are configured.
          - NO hardcoded minimum (was wrongly set to 10).
          - Buffer = 20% of detected vehicles (proportional only).
        """
        if self.slots and len(occupancy_status) > 0:
            # ── SLOT MODE ────────────────────────────────────────────
            total = len(occupancy_status)
            occupied = sum(1 for v in occupancy_status.values() if v == "Occupied")
            available = total - occupied          # enforced invariant
            rate = int(occupied / total * 100) if total > 0 else 0
            print(f"[Stats] Slot Mode: total={total}, occupied={occupied}, available={available}")
            return {
                "Mode": "Slot Mode",
                "Total Slots": total,
                "Occupied": occupied,
                "Available": available,
                "Occupancy Rate": f"{rate}%",
            }
        else:
            # ── ESTIMATED CAPACITY MODE ───────────────────────────────
            # Use ALL detections — no secondary confidence filter
            valid_count = len(detections or [])

            # Proportional 20% buffer — NO hardcoded minimum of 10
            buffer = max(int(valid_count * 0.20), 1)
            estimated_total = valid_count + buffer
            estimated_available = buffer          # enforced invariant
            rate = int(valid_count / estimated_total * 100) if estimated_total > 0 else 0

            print(f"[Stats] Estimated Capacity: detected={valid_count}, "
                  f"total={estimated_total}, available={estimated_available}")
            return {
                "Mode": "Estimated Capacity",
                "Total Slots": estimated_total,
                "Occupied": valid_count,
                "Available": estimated_available,
                "Occupancy Rate": f"{rate}%",
            }


occupancy_service = OccupancyService()
