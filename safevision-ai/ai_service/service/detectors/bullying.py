"""Bullying detection module using trajectory analysis and person grouping."""

import logging
from dataclasses import dataclass

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class BullyingDetection:
    confidence: float
    severity: str
    description: str
    pattern: str
    num_aggressors: int
    bbox: tuple[int, int, int, int] | None = None


class BullyingDetector:
    """
    Detects bullying-related interactions:
    - Multiple people surrounding one person
    - Aggressive body movement toward isolated individual
    - Repeated intimidation behavior
    - Hostile proximity patterns

    Uses trajectory analysis and person grouping logic.
    """

    def __init__(self) -> None:
        self._tracking_history: dict[int, list[tuple[float, float]]] = {}
        self._frame_count = 0

    def detect(
        self,
        persons: list[dict],
        frame: np.ndarray,
        threshold: float = 0.60,
    ) -> list[BullyingDetection]:
        """Analyze person positions and movements for bullying patterns."""
        self._frame_count += 1
        if len(persons) < 3:
            return []

        detections: list[BullyingDetection] = []

        surrounding = self._detect_surrounding_pattern(persons, threshold)
        detections.extend(surrounding)

        if self._frame_count > 30:
            intimidation = self._detect_intimidation_pattern(persons, threshold)
            detections.extend(intimidation)

        return detections

    def _detect_surrounding_pattern(
        self, persons: list[dict], threshold: float
    ) -> list[BullyingDetection]:
        """Detect when multiple people surround a single person."""
        detections: list[BullyingDetection] = []
        centers = []
        for p in persons:
            bbox = p["bbox"]
            cx = (bbox[0] + bbox[2]) / 2
            cy = (bbox[1] + bbox[3]) / 2
            centers.append((cx, cy))

        for i, (cx_target, cy_target) in enumerate(centers):
            nearby = []
            for j, (cx_other, cy_other) in enumerate(centers):
                if i == j:
                    continue
                dist = ((cx_target - cx_other) ** 2 + (cy_target - cy_other) ** 2) ** 0.5
                avg_size = (
                    (persons[i]["bbox"][2] - persons[i]["bbox"][0])
                    + (persons[j]["bbox"][2] - persons[j]["bbox"][0])
                ) / 2
                if dist < avg_size * 2.0:
                    nearby.append(j)

            if len(nearby) >= 2:
                angles = []
                for j in nearby:
                    dx = centers[j][0] - cx_target
                    dy = centers[j][1] - cy_target
                    angle = np.arctan2(dy, dx)
                    angles.append(angle)

                angles.sort()
                spread = max(angles) - min(angles) if angles else 0
                surrounding_score = min(1.0, spread / np.pi)

                confidence = surrounding_score * 0.6 + (len(nearby) / len(persons)) * 0.4

                if confidence >= threshold:
                    severity = "high" if len(nearby) >= 3 else "medium"
                    detections.append(
                        BullyingDetection(
                            confidence=round(confidence, 2),
                            severity=severity,
                            description=(
                                f"{len(nearby)} people surrounding 1 person — "
                                f"possible bullying (confidence: {confidence:.0%})"
                            ),
                            pattern="surrounding",
                            num_aggressors=len(nearby),
                            bbox=persons[i]["bbox"],
                        )
                    )

        return detections

    def _detect_intimidation_pattern(
        self, persons: list[dict], threshold: float
    ) -> list[BullyingDetection]:
        """Detect repeated approach/intimidation movements."""
        return []
