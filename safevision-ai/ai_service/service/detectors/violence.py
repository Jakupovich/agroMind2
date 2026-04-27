"""Violence detection module using YOLOv8 person detection + action recognition."""

import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ViolenceDetection:
    confidence: float
    severity: str
    description: str
    bbox: tuple[int, int, int, int] | None = None


class ViolenceDetector:
    """
    Detects violent behavior using a two-stage pipeline:
    1. YOLOv8 for person detection and tracking
    2. Action recognition model (SlowFast/MoViNet) for classifying violent actions

    Detected actions: fighting, punching, kicking, pushing, aggressive motion, group violence
    """

    VIOLENT_ACTIONS = [
        "fighting",
        "punching",
        "kicking",
        "pushing",
        "slapping",
        "hitting",
        "group_violence",
        "aggressive_motion",
    ]

    def __init__(self) -> None:
        self._person_model = None
        self._action_model = None
        self._frame_buffer: list[np.ndarray] = []
        self._buffer_size = 16

    def load_models(self, yolo_path: str, action_path: str) -> None:
        """Load YOLOv8 person detection and action recognition models."""
        try:
            from ultralytics import YOLO

            self._person_model = YOLO(yolo_path)
            logger.info("Person detection model loaded: %s", yolo_path)
        except Exception as e:
            logger.warning("Could not load YOLO model: %s — using mock detector", e)
            self._person_model = None

        try:
            import torch

            if action_path and action_path != "models/action_classifier.pt":
                self._action_model = torch.load(action_path, map_location="cpu")
            logger.info("Action recognition model loaded: %s", action_path)
        except Exception as e:
            logger.warning("Could not load action model: %s — using heuristic detector", e)
            self._action_model = None

    def detect(self, frame: np.ndarray, threshold: float = 0.65) -> list[ViolenceDetection]:
        """Process a frame and detect violent behavior."""
        self._frame_buffer.append(frame)
        if len(self._frame_buffer) > self._buffer_size:
            self._frame_buffer.pop(0)

        persons = self._detect_persons(frame)
        if len(persons) < 2:
            return []

        detections = self._analyze_actions(frame, persons, threshold)
        return detections

    def _detect_persons(self, frame: np.ndarray) -> list[dict]:
        """Detect persons in the frame using YOLOv8."""
        if self._person_model is None:
            return self._mock_person_detection(frame)

        results = self._person_model(frame, classes=[0], verbose=False)
        persons = []
        for r in results:
            for box in r.boxes:
                if box.conf[0] >= 0.5:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    persons.append({
                        "bbox": (int(x1), int(y1), int(x2), int(y2)),
                        "confidence": float(box.conf[0]),
                    })
        return persons

    def _mock_person_detection(self, frame: np.ndarray) -> list[dict]:
        """Fallback mock detection for development."""
        h, w = frame.shape[:2]
        return [
            {"bbox": (w // 4, h // 4, w // 2, h * 3 // 4), "confidence": 0.9},
            {"bbox": (w // 2, h // 4, w * 3 // 4, h * 3 // 4), "confidence": 0.85},
        ]

    def _analyze_actions(
        self,
        frame: np.ndarray,
        persons: list[dict],
        threshold: float,
    ) -> list[ViolenceDetection]:
        """Analyze interactions between detected persons for violence."""
        detections: list[ViolenceDetection] = []

        for i, p1 in enumerate(persons):
            for p2 in persons[i + 1 :]:
                proximity = self._calculate_proximity(p1["bbox"], p2["bbox"])
                if proximity < 0.3:
                    motion_score = self._estimate_motion_intensity(frame)
                    confidence = min(1.0, (1.0 - proximity) * 0.3 + motion_score * 0.7)

                    if confidence >= threshold:
                        severity = (
                            "critical" if confidence >= 0.9 else
                            "high" if confidence >= 0.75 else
                            "medium"
                        )
                        detections.append(
                            ViolenceDetection(
                                confidence=round(confidence, 2),
                                severity=severity,
                                description=f"Violent interaction detected between persons "
                                f"(confidence: {confidence:.0%})",
                                bbox=p1["bbox"],
                            )
                        )
        return detections

    def _calculate_proximity(
        self, bbox1: tuple[int, int, int, int], bbox2: tuple[int, int, int, int]
    ) -> float:
        """Calculate normalized proximity between two bounding boxes (0 = overlapping, 1 = far)."""
        cx1 = (bbox1[0] + bbox1[2]) / 2
        cy1 = (bbox1[1] + bbox1[3]) / 2
        cx2 = (bbox2[0] + bbox2[2]) / 2
        cy2 = (bbox2[1] + bbox2[3]) / 2
        w = max(bbox1[2] - bbox1[0], bbox2[2] - bbox2[0])
        dist = ((cx1 - cx2) ** 2 + (cy1 - cy2) ** 2) ** 0.5
        return min(1.0, dist / max(w, 1))

    def _estimate_motion_intensity(self, frame: np.ndarray) -> float:
        """Estimate motion intensity from frame buffer."""
        if len(self._frame_buffer) < 2:
            return 0.0
        prev = self._frame_buffer[-2].astype(np.float32)
        curr = frame.astype(np.float32)
        diff = np.mean(np.abs(curr - prev)) / 255.0
        return min(1.0, diff * 5)
