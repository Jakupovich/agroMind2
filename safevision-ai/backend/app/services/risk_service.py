import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.camera import Camera
from app.models.incident import Incident
from app.models.location import Zone
from app.models.risk import RiskScore

logger = logging.getLogger(__name__)


async def calculate_zone_risk(db: AsyncSession, zone_id: int) -> RiskScore | None:
    """Calculate risk score for a zone based on historical incidents."""
    zone_result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = zone_result.scalar_one_or_none()
    if not zone:
        return None

    now = datetime.now(timezone.utc)
    lookback = now - timedelta(days=30)

    incident_result = await db.execute(
        select(Incident)
        .join(Camera, Incident.camera_id == Camera.id)
        .where(Camera.zone_id == zone_id, Incident.detected_at >= lookback)
    )
    incidents = incident_result.scalars().all()

    total = len(incidents)
    if total == 0:
        score = 0.0
    else:
        severity_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        weighted = sum(severity_weights.get(i.severity, 1) for i in incidents)
        score = min(10.0, (weighted / max(total, 1)) * (total / 5.0))

    risk_level = (
        "critical" if score >= 8 else
        "high" if score >= 6 else
        "medium" if score >= 3 else
        "low"
    )

    hour_counts: dict[int, int] = {}
    for inc in incidents:
        h = inc.detected_at.hour
        hour_counts[h] = hour_counts.get(h, 0) + 1

    peak_start = None
    peak_end = None
    if hour_counts:
        peak_hour = max(hour_counts, key=lambda h: hour_counts[h])
        peak_start = peak_hour
        peak_end = (peak_hour + 1) % 24

    probability = min(1.0, total / 30.0)

    from app.models.location import Location

    loc_result = await db.execute(
        select(Location).where(Location.id == zone.location_id)
    )
    location = loc_result.scalar_one_or_none()
    org_id = location.organization_id if location else 0

    risk = RiskScore(
        zone_id=zone_id,
        location_id=zone.location_id,
        organization_id=org_id,
        score=round(score, 1),
        risk_level=risk_level,
        peak_hour_start=peak_start,
        peak_hour_end=peak_end,
        incident_probability=round(probability, 2),
        trend="stable",
    )
    db.add(risk)
    zone.risk_score = round(score, 1)
    await db.flush()
    return risk


async def recalculate_all_risks(db: AsyncSession, organization_id: int) -> list[RiskScore]:
    """Recalculate risk scores for all zones in an organization."""
    from app.models.location import Location

    zones_result = await db.execute(
        select(Zone)
        .join(Location, Zone.location_id == Location.id)
        .where(Location.organization_id == organization_id)
    )
    zones = zones_result.scalars().all()

    scores = []
    for zone in zones:
        risk = await calculate_zone_risk(db, zone.id)
        if risk:
            scores.append(risk)
    return scores
