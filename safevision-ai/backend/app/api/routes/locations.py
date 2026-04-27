from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.location import Location, Zone
from app.models.user import User
from app.schemas.location import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    ZoneCreate,
    ZoneResponse,
    ZoneUpdate,
)

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/", response_model=list[LocationResponse])
async def list_locations(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Location).where(Location.organization_id == user.organization_id)
    result = await db.execute(q.order_by(Location.name))
    return result.scalars().all()


@router.post("/", response_model=LocationResponse, status_code=201)
async def create_location(
    body: LocationCreate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    loc = Location(organization_id=user.organization_id, **body.model_dump())
    db.add(loc)
    await db.flush()
    return loc


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    return loc


@router.patch("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    body: LocationUpdate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Location not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(loc, field, value)
    await db.flush()
    return loc


# ─── Zones ────────────────────────────────────────────────────────────────────

@router.get("/{location_id}/zones", response_model=list[ZoneResponse])
async def list_zones(
    location_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Zone)
        .join(Location)
        .where(Zone.location_id == location_id, Location.organization_id == user.organization_id)
    )
    return result.scalars().all()


@router.post("/{location_id}/zones", response_model=ZoneResponse, status_code=201)
async def create_zone(
    location_id: int,
    body: ZoneCreate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Location).where(
            Location.id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Location not found")
    zone = Zone(location_id=location_id, **body.model_dump())
    db.add(zone)
    await db.flush()
    return zone


@router.patch("/{location_id}/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    location_id: int,
    zone_id: int,
    body: ZoneUpdate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Zone)
        .join(Location)
        .where(
            Zone.id == zone_id,
            Zone.location_id == location_id,
            Location.organization_id == user.organization_id,
        )
    )
    zone = result.scalar_one_or_none()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(zone, field, value)
    await db.flush()
    return zone
