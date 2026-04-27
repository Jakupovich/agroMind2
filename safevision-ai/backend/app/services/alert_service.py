import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.incident import Alert, Incident
from app.models.user import User

logger = logging.getLogger(__name__)


async def create_alerts_for_incident(
    db: AsyncSession, incident: Incident
) -> list[Alert]:
    """Create alert records for all users in the organization who should be notified."""
    result = await db.execute(
        select(User).where(
            User.organization_id == incident.organization_id,
            User.is_active.is_(True),
        )
    )
    users = result.scalars().all()
    alerts: list[Alert] = []

    for user in users:
        if user.email_alerts:
            alert = Alert(
                incident_id=incident.id,
                alert_type=incident.incident_type,
                channel="email",
                recipient=user.email,
                status="pending",
            )
            db.add(alert)
            alerts.append(alert)

        if user.sms_alerts and user.phone:
            alert = Alert(
                incident_id=incident.id,
                alert_type=incident.incident_type,
                channel="sms",
                recipient=user.phone,
                status="pending",
            )
            db.add(alert)
            alerts.append(alert)

        dashboard_alert = Alert(
            incident_id=incident.id,
            alert_type=incident.incident_type,
            channel="dashboard",
            recipient=str(user.id),
            status="sent",
            sent_at=datetime.now(timezone.utc),
        )
        db.add(dashboard_alert)
        alerts.append(dashboard_alert)

    await db.flush()
    return alerts


async def send_email_alert(alert: Alert, incident: Incident) -> None:
    """Send an email alert. Placeholder for SMTP integration."""
    logger.info(
        "Sending email alert to %s for incident #%d (%s)",
        alert.recipient,
        incident.id,
        incident.incident_type,
    )


async def send_sms_alert(alert: Alert, incident: Incident) -> None:
    """Send an SMS alert via Twilio. Placeholder for integration."""
    logger.info(
        "Sending SMS alert to %s for incident #%d (%s)",
        alert.recipient,
        incident.id,
        incident.incident_type,
    )
