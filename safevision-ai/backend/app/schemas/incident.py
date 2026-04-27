from datetime import datetime

from pydantic import BaseModel


class IncidentCreate(BaseModel):
    camera_id: int
    incident_type: str
    severity: str
    description: str
    confidence: float = 0.0
    screenshot_url: str | None = None
    clip_url: str | None = None


class IncidentUpdate(BaseModel):
    status: str | None = None
    severity: str | None = None


class IncidentResponse(BaseModel):
    id: int
    camera_id: int
    organization_id: int
    location_id: int
    incident_type: str
    severity: str
    description: str
    status: str
    confidence: float
    screenshot_url: str | None
    clip_url: str | None
    detected_at: datetime
    resolved_at: datetime | None
    resolved_by_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}


class IncidentStats(BaseModel):
    total: int
    open: int
    resolved: int
    critical: int
    high: int
    medium: int
    low: int
    by_type: dict[str, int]


class AIDetectionEvent(BaseModel):
    camera_id: int
    incident_type: str
    severity: str
    confidence: float
    description: str
    screenshot_base64: str | None = None
    clip_path: str | None = None
    detected_at: datetime | None = None
