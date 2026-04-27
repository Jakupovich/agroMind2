from datetime import datetime

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "operator"
    phone: str | None = None
    email_alerts: bool = True
    sms_alerts: bool = False


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
    role: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    email_alerts: bool | None = None
    sms_alerts: bool | None = None


class UserResponse(BaseModel):
    id: int
    organization_id: int | None
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: str | None
    avatar_url: str | None
    email_alerts: bool
    sms_alerts: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
