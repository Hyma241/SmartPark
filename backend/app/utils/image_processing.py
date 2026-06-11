import cv2
import numpy as np
import base64


def draw_results(image, detections, occupancy_status, slots):
    """
    Draws bounding boxes for detected vehicles and polygon overlays for parking slots.

    COLOUR SEMANTICS (canonical):
      GREEN overlay / border  →  AVAILABLE slot
      RED   overlay / border  →  OCCUPIED  slot

    Vehicle bounding boxes are drawn in cyan so they are visually distinct
    from the slot overlays.
    """
    img_draw = image.copy()

    # ── Parking Slot Overlays ─────────────────────────────────────────
    overlay = img_draw.copy()

    for slot_id, polygon in (slots or {}).items():
        pts = np.array(polygon, dtype=np.int32).reshape((-1, 1, 2))

        is_occupied = occupancy_status.get(slot_id) == "Occupied"
        # BGR:  RED = occupied,  GREEN = available
        color = (0, 0, 220) if is_occupied else (0, 220, 0)

        cv2.fillPoly(overlay, [pts], color)
        cv2.polylines(img_draw, [pts], isClosed=True, color=color, thickness=2)

        # Slot label at centroid
        M = cv2.moments(pts)
        if M["m00"] != 0:
            cX = int(M["m10"] / M["m00"])
            cY = int(M["m01"] / M["m00"])
            status_letter = "X" if is_occupied else "✓"
            cv2.putText(
                img_draw,
                f"{slot_id} {status_letter}",
                (cX - 20, cY),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
            )

    # Blend slot overlay with the base image
    alpha = 0.30
    img_draw = cv2.addWeighted(overlay, alpha, img_draw, 1 - alpha, 0)

    # ── Vehicle Bounding Boxes ─────────────────────────────────────────
    for det in detections:
        x1, y1, x2, y2 = det["box"]
        conf = det["confidence"]
        cls_name = det["class_name"]
        track_id = det.get("track_id")

        # Cyan bounding box — distinct from slot overlays
        box_color = (255, 200, 0)   # BGR cyan-yellow
        cv2.rectangle(img_draw, (x1, y1), (x2, y2), box_color, 2)

        # Label: class name + confidence + optional track ID
        if track_id is not None:
            label = f"#{track_id} {cls_name} {conf:.0%}"
        else:
            label = f"{cls_name} {conf:.0%}"

        label_y = max(y1 - 8, 14)
        cv2.putText(
            img_draw, label, (x1, label_y),
            cv2.FONT_HERSHEY_SIMPLEX, 0.45, box_color, 2
        )

        # Centre dot
        cx, cy = det["center"]
        cv2.circle(img_draw, (cx, cy), 4, (0, 255, 255), -1)

    return img_draw


def encode_image_base64(image):
    """Encode OpenCV image to a base64 data URL for the React frontend."""
    _, buffer = cv2.imencode(".jpg", image, [cv2.IMWRITE_JPEG_QUALITY, 92])
    img_str = base64.b64encode(buffer).decode("utf-8")
    return f"data:image/jpeg;base64,{img_str}"


def decode_image_bytes(image_bytes):
    """Decode raw bytes to an OpenCV BGR image."""
    np_arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
