"""DeepSORT person tracking wrapper."""

import logging
from dataclasses import dataclass, field

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class Track:
    track_id: int
    bbox: tuple[int, int, int, int]
    confidence: float
    class_id: int = 0
    history: list[tuple[int, int]] = field(default_factory=list)
    frames_since_update: int = 0
    age: int = 0


class DeepSORTTracker:
    """
    Person tracking using DeepSORT algorithm.
    Provides consistent person IDs across frames for trajectory analysis.
    """

    def __init__(self, max_age: int = 30, min_hits: int = 3, iou_threshold: float = 0.3) -> None:
        self._tracks: list[Track] = []
        self._next_id = 0
        self._max_age = max_age
        self._min_hits = min_hits
        self._iou_threshold = iou_threshold

    def update(self, detections: list[dict]) -> list[Track]:
        """
        Update tracks with new detections.

        Args:
            detections: List of dicts with 'bbox' and 'confidence' keys.

        Returns:
            List of active tracks with consistent IDs.
        """
        if not detections:
            for track in self._tracks:
                track.frames_since_update += 1
            self._tracks = [t for t in self._tracks if t.frames_since_update < self._max_age]
            return self._tracks

        matched, unmatched_dets, unmatched_tracks = self._match(detections)

        for track_idx, det_idx in matched:
            det = detections[det_idx]
            track = self._tracks[track_idx]
            track.bbox = det["bbox"]
            track.confidence = det["confidence"]
            track.frames_since_update = 0
            track.age += 1
            cx = (det["bbox"][0] + det["bbox"][2]) // 2
            cy = (det["bbox"][1] + det["bbox"][3]) // 2
            track.history.append((cx, cy))
            if len(track.history) > 100:
                track.history.pop(0)

        for det_idx in unmatched_dets:
            det = detections[det_idx]
            self._tracks.append(
                Track(
                    track_id=self._next_id,
                    bbox=det["bbox"],
                    confidence=det["confidence"],
                    history=[
                        (
                            (det["bbox"][0] + det["bbox"][2]) // 2,
                            (det["bbox"][1] + det["bbox"][3]) // 2,
                        )
                    ],
                )
            )
            self._next_id += 1

        for track_idx in unmatched_tracks:
            self._tracks[track_idx].frames_since_update += 1

        self._tracks = [t for t in self._tracks if t.frames_since_update < self._max_age]
        return [t for t in self._tracks if t.age >= self._min_hits]

    def _match(
        self, detections: list[dict]
    ) -> tuple[list[tuple[int, int]], list[int], list[int]]:
        """Match detections to existing tracks using IoU."""
        if not self._tracks:
            return [], list(range(len(detections))), []

        iou_matrix = np.zeros((len(self._tracks), len(detections)))
        for t_idx, track in enumerate(self._tracks):
            for d_idx, det in enumerate(detections):
                iou_matrix[t_idx, d_idx] = self._iou(track.bbox, det["bbox"])

        matched = []
        used_tracks: set[int] = set()
        used_dets: set[int] = set()

        while True:
            if iou_matrix.size == 0:
                break
            max_val = iou_matrix.max()
            if max_val < self._iou_threshold:
                break
            t_idx, d_idx = np.unravel_index(iou_matrix.argmax(), iou_matrix.shape)
            matched.append((int(t_idx), int(d_idx)))
            used_tracks.add(int(t_idx))
            used_dets.add(int(d_idx))
            iou_matrix[t_idx, :] = 0
            iou_matrix[:, d_idx] = 0

        unmatched_dets = [i for i in range(len(detections)) if i not in used_dets]
        unmatched_tracks = [i for i in range(len(self._tracks)) if i not in used_tracks]
        return matched, unmatched_dets, unmatched_tracks

    @staticmethod
    def _iou(
        bbox1: tuple[int, int, int, int], bbox2: tuple[int, int, int, int]
    ) -> float:
        x1 = max(bbox1[0], bbox2[0])
        y1 = max(bbox1[1], bbox2[1])
        x2 = min(bbox1[2], bbox2[2])
        y2 = min(bbox1[3], bbox2[3])
        inter = max(0, x2 - x1) * max(0, y2 - y1)
        area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
        area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
        union = area1 + area2 - inter
        return inter / max(union, 1e-6)
