import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query

logger = logging.getLogger(__name__)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.camera import Camera
from app.models.incident import Incident
from app.models.user import User
from app.schemas.incident import AIDetectionEvent, IncidentCreate, IncidentResponse, IncidentStats, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("/", response_model=list[IncidentResponse])
async def list_incidents(
    status: str | None = None,
    severity: str | None = None,
    incident_type: str | None = None,
    location_id: int | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Incident).where(Incident.organization_id == user.organization_id)
    if status:
        q = q.where(Incident.status == status)
    if severity:
        q = q.where(Incident.severity == severity)
    if incident_type:
        q = q.where(Incident.incident_type == incident_type)
    if location_id:
        q = q.where(Incident.location_id == location_id)
    q = q.order_by(Incident.detected_at.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/stats", response_model=IncidentStats)
async def get_incident_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    base = select(Incident).where(Incident.organization_id == user.organization_id)

    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar() or 0

    open_result = await db.execute(
        select(func.count()).select_from(
            base.where(Incident.status == "open").subquery()
        )
    )
    open_count = open_result.scalar() or 0

    resolved_result = await db.execute(
        select(func.count()).select_from(
            base.where(Incident.status == "resolved").subquery()
        )
    )
    resolved_count = resolved_result.scalar() or 0

    severity_counts = {}
    for sev in ["critical", "high", "medium", "low"]:
        r = await db.execute(
            select(func.count()).select_from(
                base.where(Incident.severity == sev).subquery()
            )
        )
        severity_counts[sev] = r.scalar() or 0

    type_result = await db.execute(
        select(Incident.incident_type, func.count())
        .where(Incident.organization_id == user.organization_id)
        .group_by(Incident.incident_type)
    )
    by_type = {row[0]: row[1] for row in type_result.all()}

    return IncidentStats(
        total=total,
        open=open_count,
        resolved=resolved_count,
        critical=severity_counts["critical"],
        high=severity_counts["high"],
        medium=severity_counts["medium"],
        low=severity_counts["low"],
        by_type=by_type,
    )


@router.get("/{incident_id}", response_model=IncidentResponse)
async def get_incident(
    incident_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Incident).where(
            Incident.id == incident_id,
            Incident.organization_id == user.organization_id,
        )
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.patch("/{incident_id}", response_model=IncidentResponse)
async def update_incident(
    incident_id: int,
    body: IncidentUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Incident).where(
            Incident.id == incident_id,
            Incident.organization_id == user.organization_id,
        )
    )
    incident = result.scalar_one_or_none()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if body.status == "resolved" and incident.status != "resolved":
        incident.resolved_at = datetime.now(timezone.utc)
        incident.resolved_by_id = user.id
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(incident, field, value)
    await db.flush()
    return incident


async def verify_internal_api_key(
    x_api_key: str = Header(alias="X-Internal-API-Key"),
) -> str:
    if x_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Invalid internal API key")
    return x_api_key


@router.post("/detect", response_model=IncidentResponse, status_code=201)
async def create_incident_from_detection(
    body: AIDetectionEvent,
    db: AsyncSession = Depends(get_db),
    _api_key: str = Depends(verify_internal_api_key),
):
    """Internal endpoint called by the AI service when an incident is detected."""
    cam_result = await db.execute(select(Camera).where(Camera.id == body.camera_id))
    camera = cam_result.scalar_one_or_none()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    from app.models.location import Location

    loc_result = await db.execute(select(Location).where(Location.id == camera.location_id))
    location = loc_result.scalar_one_or_none()

    screenshot_url = None
    if body.screenshot_base64:
        if settings.S3_BUCKET and settings.AWS_ACCESS_KEY_ID:
            # TODO: upload to S3 and set screenshot_url to the resulting URL
            logger.warning("S3 screenshot upload not yet implemented")
        else:
            logger.warning("Screenshot received but S3 not configured — skipping storage")

    if not location:
        raise HTTPException(status_code=404, detail="Camera location not found")

    incident = Incident(
        camera_id=body.camera_id,
        organization_id=location.organization_id,
        location_id=camera.location_id,
        incident_type=body.incident_type,
        severity=body.severity,
        description=body.description,
        confidence=body.confidence,
        screenshot_url=screenshot_url,
    )
    db.add(incident)
    await db.flush()
    return incident
