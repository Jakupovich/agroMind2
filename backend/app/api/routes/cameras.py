from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.camera import Camera
from app.models.location import Location
from app.models.user import User
from app.schemas.camera import CameraCreate, CameraResponse, CameraUpdate

router = APIRouter(prefix="/locations/{location_id}/cameras", tags=["Cameras"])


@router.get("/", response_model=list[CameraResponse])
async def list_cameras(
    location_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Camera)
        .join(Location)
        .where(Camera.location_id == location_id, Location.organization_id == user.organization_id)
        .order_by(Camera.name)
    )
    return result.scalars().all()


@router.post("/", response_model=CameraResponse, status_code=201)
async def create_camera(
    location_id: int,
    body: CameraCreate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    loc_result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    if not loc_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Location not found")
    camera = Camera(location_id=location_id, **body.model_dump())
    db.add(camera)
    await db.flush()
    return camera


@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    location_id: int,
    camera_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Camera)
        .join(Location)
        .where(
            Camera.id == camera_id,
            Camera.location_id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera


@router.patch("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    location_id: int,
    camera_id: int,
    body: CameraUpdate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Camera)
        .join(Location)
        .where(
            Camera.id == camera_id,
            Camera.location_id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(camera, field, value)
    await db.flush()
    return camera


@router.delete("/{camera_id}", status_code=204)
async def delete_camera(
    location_id: int,
    camera_id: int,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Camera)
        .join(Location)
        .where(
            Camera.id == camera_id,
            Camera.location_id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    camera = result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    await db.delete(camera)
