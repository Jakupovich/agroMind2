from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_cameras: int
    active_cameras: int
    total_incidents_today: int
    open_incidents: int
    critical_alerts: int
    avg_risk_score: float


class IncidentTrend(BaseModel):
    date: str
    violence: int
    bullying: int
    weapon: int
    total: int


class ZoneRisk(BaseModel):
    zone_id: int
    zone_name: str
    risk_score: float
    risk_level: str
    incident_count: int
    peak_hours: str | None


class HeatmapData(BaseModel):
    zone_id: int
    zone_name: str
    location_name: str
    incident_count: int
    risk_score: float
    severity_breakdown: dict[str, int]


class RiskPrediction(BaseModel):
    zone_id: int
    zone_name: str
    risk_score: float
    risk_level: str
    peak_hour_start: int | None
    peak_hour_end: int | None
    incident_probability: float
    trend: str
    recommendation: str
