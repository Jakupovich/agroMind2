from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import ChangePasswordRequest, UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/", response_model=list[UserResponse])
async def list_users(
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    q = select(User)
    if user.role != "super_admin":
        q = q.where(User.organization_id == user.organization_id)
    result = await db.execute(q.order_by(User.full_name))
    return result.scalars().all()


@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(
        organization_id=user.organization_id,
        email=body.email,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        phone=body.phone,
        email_alerts=body.email_alerts,
        sms_alerts=body.sms_alerts,
    )
    db.add(new_user)
    await db.flush()
    return new_user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    body: UserUpdate,
    current_user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if current_user.role != "super_admin" and target.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(target, field, value)
    await db.flush()
    return target


@router.post("/change-password", status_code=204)
async def change_password(
    body: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not verify_password(body.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    user.hashed_password = hash_password(body.new_password)
    await db.flush()
