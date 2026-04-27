from datetime import datetime

from pydantic import BaseModel


class CameraCreate(BaseModel):
    name: str
    rtsp_url: str
    zone_id: int | None = None
    camera_type: str = "ip"
    detection_enabled: bool = True
    violence_detection: bool = True
    bullying_detection: bool = False
    weapon_detection: bool = False


class CameraUpdate(BaseModel):
    name: str | None = None
    rtsp_url: str | None = None
    zone_id: int | None = None
    camera_type: str | None = None
    status: str | None = None
    is_active: bool | None = None
    detection_enabled: bool | None = None
    violence_detection: bool | None = None
    bullying_detection: bool | None = None
    weapon_detection: bool | None = None


class CameraResponse(BaseModel):
    id: int
    location_id: int
    zone_id: int | None
    name: str
    rtsp_url: str
    camera_type: str
    status: str
    is_active: bool
    thumbnail_url: str | None
    detection_enabled: bool
    violence_detection: bool
    bullying_detection: bool
    weapon_detection: bool
    created_at: datetime

    model_config = {"from_attributes": True}
