from datetime import datetime

from pydantic import BaseModel


class OrganizationCreate(BaseModel):
    name: str
    description: str | None = None
    logo_url: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    logo_url: str | None = None
    is_active: bool | None = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    is_active: bool
    subscription_plan: str
    subscription_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
