from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.models.organization import Organization
from app.models.user import User
from app.schemas.organization import OrganizationResponse, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("/current", response_model=OrganizationResponse)
async def get_current_organization(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not user.organization_id:
        raise HTTPException(status_code=404, detail="No organization assigned")
    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/current", response_model=OrganizationResponse)
async def update_organization(
    body: OrganizationUpdate,
    user: User = Depends(require_role("super_admin", "org_admin")),
    db: AsyncSession = Depends(get_db),
):
    if not user.organization_id:
        raise HTTPException(status_code=404, detail="No organization assigned")
    result = await db.execute(
        select(Organization).where(Organization.id == user.organization_id)
    )
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(org, field, value)
    await db.flush()
    return org


@router.get("/", response_model=list[OrganizationResponse])
async def list_organizations(
    _user: User = Depends(require_role("super_admin")),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).order_by(Organization.name))
    return result.scalars().all()
