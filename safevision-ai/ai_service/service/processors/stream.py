"""Camera stream processor that runs detection pipeline on RTSP/IP camera feeds."""

import asyncio
import base64
import io
import logging
import time
from collections import deque
from datetime import datetime, timezone

import cv2
import httpx
import numpy as np
from PIL import Image

from service.config import ai_settings
from service.detectors.bullying import BullyingDetector
from service.detectors.violence import ViolenceDetector
from service.detectors.weapon import WeaponDetector
from service.trackers.deep_sort import DeepSORTTracker

logger = logging.getLogger(__name__)


class StreamProcessor:
    """Processes a single camera stream and runs detection pipeline."""

    def __init__(self, camera_id: int, rtsp_url: str, camera_name: str) -> None:
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.camera_name = camera_name
        self._running = False

        self.violence_detector = ViolenceDetector()
        self.weapon_detector = WeaponDetector()
        self.bullying_detector = BullyingDetector()
        self.tracker = DeepSORTTracker()

        self._frame_buffer: deque[np.ndarray] = deque(
            maxlen=ai_settings.CLIP_BUFFER_SECONDS_BEFORE * 15
        )
        self._frame_count = 0
        self._last_alert_time: float = 0
        self._alert_cooldown = 10.0

    def load_models(self) -> None:
        self.violence_detector.load_models(
            ai_settings.YOLO_MODEL_PATH, ai_settings.ACTION_MODEL_PATH
        )
        self.weapon_detector.load_model(ai_settings.WEAPON_MODEL_PATH)

    async def start(self) -> None:
        """Start processing the camera stream."""
        self._running = True
        logger.info("Starting stream processor for camera %d: %s", self.camera_id, self.camera_name)

        while self._running:
            try:
                await self._process_stream()
            except Exception as e:
                logger.error("Stream error for camera %d: %s", self.camera_id, e)
                await asyncio.sleep(5)

    async def stop(self) -> None:
        self._running = False

    async def _process_stream(self) -> None:
        """Open RTSP stream and process frames."""
        cap = cv2.VideoCapture(self.rtsp_url)
        if not cap.isOpened():
            logger.error("Cannot open stream: %s", self.rtsp_url)
            await asyncio.sleep(10)
            return

        try:
            while self._running and cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break

                self._frame_count += 1
                self._frame_buffer.append(frame)

                if self._frame_count % ai_settings.FRAME_SKIP != 0:
                    continue

                await self._run_detections(frame)
                await asyncio.sleep(0.01)
        finally:
            cap.release()

    async def _run_detections(self, frame: np.ndarray) -> None:
        """Run all detection models on the frame."""
        now = time.time()
        if now - self._last_alert_time < self._alert_cooldown:
            return

        violence_results = self.violence_detector.detect(
            frame, ai_settings.VIOLENCE_CONFIDENCE_THRESHOLD
        )
        for det in violence_results:
            await self._report_incident(
                incident_type="violence",
                severity=det.severity,
                confidence=det.confidence,
                description=det.description,
                frame=frame,
            )

        weapon_results = self.weapon_detector.detect(
            frame, ai_settings.WEAPON_CONFIDENCE_THRESHOLD
        )
        for det in weapon_results:
            await self._report_incident(
                incident_type="weapon",
                severity=det.severity,
                confidence=det.confidence,
                description=det.description,
                frame=frame,
            )

        persons = self.violence_detector._detect_persons(frame)
        tracks = self.tracker.update(persons)
        person_dicts = [{"bbox": t.bbox, "confidence": t.confidence} for t in tracks]

        bullying_results = self.bullying_detector.detect(
            person_dicts, frame, ai_settings.BULLYING_CONFIDENCE_THRESHOLD
        )
        for det in bullying_results:
            await self._report_incident(
                incident_type="bullying",
                severity=det.severity,
                confidence=det.confidence,
                description=det.description,
                frame=frame,
            )

    async def _report_incident(
        self,
        incident_type: str,
        severity: str,
        confidence: float,
        description: str,
        frame: np.ndarray,
    ) -> None:
        """Report a detected incident to the API."""
        self._last_alert_time = time.time()
        screenshot_b64 = self._frame_to_base64(frame)

        payload = {
            "camera_id": self.camera_id,
            "incident_type": incident_type,
            "severity": severity,
            "confidence": confidence,
            "description": description,
            "screenshot_base64": screenshot_b64,
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{ai_settings.API_URL}/api/v1/incidents/detect",
                    json=payload,
                    timeout=10,
                )
                if resp.status_code == 201:
                    logger.info(
                        "Incident reported: %s (%s) on camera %d",
                        incident_type,
                        severity,
                        self.camera_id,
                    )
                else:
                    logger.error("Failed to report incident: %s", resp.text)
        except Exception as e:
            logger.error("Failed to report incident: %s", e)

    @staticmethod
    def _frame_to_base64(frame: np.ndarray) -> str:
        img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode()
