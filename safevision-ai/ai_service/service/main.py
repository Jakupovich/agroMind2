"""SafeVision AI Inference Service — processes camera feeds and detects incidents."""

import asyncio
import logging

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from service.config import ai_settings
from service.processors.stream import StreamProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SafeVision AI Inference Service", version="0.1.0")

active_processors: dict[int, StreamProcessor] = {}


class CameraStreamRequest(BaseModel):
    camera_id: int
    rtsp_url: str
    camera_name: str
    violence_detection: bool = True
    bullying_detection: bool = False
    weapon_detection: bool = False


class CameraStreamResponse(BaseModel):
    camera_id: int
    status: str


@app.post("/streams/start", response_model=CameraStreamResponse)
async def start_stream(body: CameraStreamRequest):
    """Start processing a camera stream."""
    if body.camera_id in active_processors:
        return CameraStreamResponse(camera_id=body.camera_id, status="already_running")

    processor = StreamProcessor(
        camera_id=body.camera_id,
        rtsp_url=body.rtsp_url,
        camera_name=body.camera_name,
    )
    processor.load_models()
    active_processors[body.camera_id] = processor
    asyncio.create_task(processor.start())
    return CameraStreamResponse(camera_id=body.camera_id, status="started")


@app.post("/streams/stop/{camera_id}", response_model=CameraStreamResponse)
async def stop_stream(camera_id: int):
    """Stop processing a camera stream."""
    processor = active_processors.pop(camera_id, None)
    if not processor:
        raise HTTPException(status_code=404, detail="Stream not found")
    await processor.stop()
    return CameraStreamResponse(camera_id=camera_id, status="stopped")


@app.get("/streams", response_model=list[CameraStreamResponse])
async def list_streams():
    """List all active camera streams."""
    return [
        CameraStreamResponse(camera_id=cid, status="running")
        for cid in active_processors
    ]


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "active_streams": len(active_processors),
        "max_streams": ai_settings.MAX_CONCURRENT_STREAMS,
    }
