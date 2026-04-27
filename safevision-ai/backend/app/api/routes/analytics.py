from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.camera import Camera
from app.models.incident import Incident
from app.models.location import Zone
from app.models.risk import RiskScore
from app.models.user import User
from app.schemas.analytics import (
    DashboardStats,
    HeatmapData,
    IncidentTrend,
    RiskPrediction,
    ZoneRisk,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard_stats(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id

    total_cam = await db.execute(
        select(func.count())
        .select_from(Camera)
        .join(Camera.location)
        .where(Camera.location.has(organization_id=org_id))
    )
    active_cam = await db.execute(
        select(func.count())
        .select_from(Camera)
        .join(Camera.location)
        .where(Camera.location.has(organization_id=org_id), Camera.status == "active")
    )

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_incidents = await db.execute(
        select(func.count())
        .select_from(Incident)
        .where(Incident.organization_id == org_id, Incident.detected_at >= today_start)
    )
    open_incidents = await db.execute(
        select(func.count())
        .select_from(Incident)
        .where(Incident.organization_id == org_id, Incident.status == "open")
    )
    critical = await db.execute(
        select(func.count())
        .select_from(Incident)
        .where(
            Incident.organization_id == org_id,
            Incident.status == "open",
            Incident.severity == "critical",
        )
    )

    avg_risk = await db.execute(
        select(func.coalesce(func.avg(RiskScore.score), 0.0))
        .where(RiskScore.organization_id == org_id)
    )

    return DashboardStats(
        total_cameras=total_cam.scalar() or 0,
        active_cameras=active_cam.scalar() or 0,
        total_incidents_today=today_incidents.scalar() or 0,
        open_incidents=open_incidents.scalar() or 0,
        critical_alerts=critical.scalar() or 0,
        avg_risk_score=round(float(avg_risk.scalar() or 0), 1),
    )


@router.get("/trends", response_model=list[IncidentTrend])
async def incident_trends(
    days: int = Query(default=30, le=365),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    start = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date(Incident.detected_at).label("date"),
            Incident.incident_type,
            func.count().label("cnt"),
        )
        .where(Incident.organization_id == org_id, Incident.detected_at >= start)
        .group_by(func.date(Incident.detected_at), Incident.incident_type)
        .order_by(func.date(Incident.detected_at))
    )

    date_data: dict[str, dict[str, int]] = {}
    for row in result.all():
        d = str(row.date)
        if d not in date_data:
            date_data[d] = {"violence": 0, "bullying": 0, "weapon": 0, "total": 0}
        date_data[d][row.incident_type] = date_data[d].get(row.incident_type, 0) + row.cnt
        date_data[d]["total"] += row.cnt

    return [
        IncidentTrend(date=d, **counts) for d, counts in date_data.items()
    ]


@router.get("/zones", response_model=list[ZoneRisk])
async def zone_risks(
    location_id: int | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    q = (
        select(
            Zone.id,
            Zone.name,
            func.coalesce(func.max(RiskScore.score), 0.0).label("risk_score"),
            func.coalesce(func.max(RiskScore.risk_level), "low").label("risk_level"),
            func.count(Incident.id).label("incident_count"),
        )
        .outerjoin(RiskScore, RiskScore.zone_id == Zone.id)
        .outerjoin(Camera, Camera.zone_id == Zone.id)
        .outerjoin(Incident, Incident.camera_id == Camera.id)
        .join(Zone.location)
        .where(Zone.location.has(organization_id=org_id))
    )
    if location_id:
        q = q.where(Zone.location_id == location_id)
    q = q.group_by(Zone.id, Zone.name)

    result = await db.execute(q)
    return [
        ZoneRisk(
            zone_id=row.id,
            zone_name=row.name,
            risk_score=float(row.risk_score),
            risk_level=row.risk_level,
            incident_count=row.incident_count,
            peak_hours=None,
        )
        for row in result.all()
    ]


@router.get("/heatmap", response_model=list[HeatmapData])
async def heatmap(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    from app.models.location import Location

    result = await db.execute(
        select(
            Zone.id,
            Zone.name,
            Location.name.label("location_name"),
            func.count(Incident.id).label("incident_count"),
            func.coalesce(func.max(RiskScore.score), 0.0).label("risk_score"),
        )
        .outerjoin(RiskScore, RiskScore.zone_id == Zone.id)
        .outerjoin(Camera, Camera.zone_id == Zone.id)
        .outerjoin(Incident, Incident.camera_id == Camera.id)
        .join(Location, Zone.location_id == Location.id)
        .where(Location.organization_id == org_id)
        .group_by(Zone.id, Zone.name, Location.name)
    )

    items = []
    for row in result.all():
        sev_result = await db.execute(
            select(Incident.severity, func.count())
            .join(Camera, Incident.camera_id == Camera.id)
            .where(Camera.zone_id == row.id)
            .group_by(Incident.severity)
        )
        severity_bd = {s: c for s, c in sev_result.all()}
        items.append(
            HeatmapData(
                zone_id=row.id,
                zone_name=row.name,
                location_name=row.location_name,
                incident_count=row.incident_count,
                risk_score=float(row.risk_score),
                severity_breakdown=severity_bd,
            )
        )
    return items


@router.get("/risk-predictions", response_model=list[RiskPrediction])
async def risk_predictions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    org_id = user.organization_id
    result = await db.execute(
        select(RiskScore, Zone.name)
        .join(Zone, RiskScore.zone_id == Zone.id)
        .where(RiskScore.organization_id == org_id)
        .order_by(RiskScore.score.desc())
    )

    predictions = []
    for risk, zone_name in result.all():
        rec = "Monitor closely" if risk.score >= 7 else (
            "Review recent incidents" if risk.score >= 4 else "Normal activity expected"
        )
        predictions.append(
            RiskPrediction(
                zone_id=risk.zone_id,
                zone_name=zone_name,
                risk_score=risk.score,
                risk_level=risk.risk_level,
                peak_hour_start=risk.peak_hour_start,
                peak_hour_end=risk.peak_hour_end,
                incident_probability=risk.incident_probability,
                trend=risk.trend,
                recommendation=rec,
            )
        )
    return predictions
