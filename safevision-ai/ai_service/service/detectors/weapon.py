"""Weapon detection module using YOLOv8 custom model."""

import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class WeaponDetection:
    weapon_type: str
    confidence: float
    severity: str
    description: str
    bbox: tuple[int, int, int, int] | None = None


class WeaponDetector:
    """
    Detects weapons using YOLOv8 custom object detection.
    Detectable: knives, guns, suspicious metallic weapon-like objects.
    """

    WEAPON_CLASSES = {
        0: "knife",
        1: "gun",
        2: "rifle",
        3: "metallic_object",
    }

    def __init__(self) -> None:
        self._model = None

    def load_model(self, model_path: str) -> None:
        """Load the weapon detection YOLOv8 model."""
        try:
            from ultralytics import YOLO

            self._model = YOLO(model_path)
            logger.info("Weapon detection model loaded: %s", model_path)
        except Exception as e:
            logger.warning("Could not load weapon model: %s — using mock detector", e)
            self._model = None

    def detect(self, frame: np.ndarray, threshold: float = 0.70) -> list[WeaponDetection]:
        """Process a frame and detect weapons."""
        if self._model is None:
            return []

        results = self._model(frame, verbose=False)
        detections: list[WeaponDetection] = []

        for r in results:
            for box in r.boxes:
                conf = float(box.conf[0])
                if conf < threshold:
                    continue
                cls_id = int(box.cls[0])
                weapon_type = self.WEAPON_CLASSES.get(cls_id, "unknown")
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                severity = "critical" if weapon_type in ("gun", "rifle") else "high"

                detections.append(
                    WeaponDetection(
                        weapon_type=weapon_type,
                        confidence=round(conf, 2),
                        severity=severity,
                        description=f"{weapon_type.replace('_', ' ').title()} detected "
                        f"(confidence: {conf:.0%})",
                        bbox=(int(x1), int(y1), int(x2), int(y2)),
                    )
                )

        return detections
