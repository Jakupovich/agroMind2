from datetime import datetime

from pydantic import BaseModel


class LocationCreate(BaseModel):
    name: str
    address: str | None = None
    location_type: str = "school"
    timezone: str = "UTC"


class LocationUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    location_type: str | None = None
    timezone: str | None = None
    is_active: bool | None = None


class LocationResponse(BaseModel):
    id: int
    organization_id: int
    name: str
    address: str | None
    location_type: str
    is_active: bool
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ZoneCreate(BaseModel):
    name: str
    zone_type: str = "hallway"


class ZoneUpdate(BaseModel):
    name: str | None = None
    zone_type: str | None = None
    is_active: bool | None = None


class ZoneResponse(BaseModel):
    id: int
    location_id: int
    name: str
    zone_type: str
    risk_score: float
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
