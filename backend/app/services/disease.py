"""Disease & pest risk service.

Pulls an hourly 7-day Open-Meteo forecast for the given coordinate, runs
every rule registered for the requested crop, and returns a
traffic-light risk report plus a short natural-language explanation.
"""
from __future__ import annotations

from app.schemas.disease import DiseaseResponse, RiskReadingResponse
from app.services.ai_explainer import generate_disease_explanation
from app.services.disease_rules import (
    RiskReading,
    build_risk_inputs,
    evaluate_crop,
)
from app.services.weather import fetch_hourly_forecast

LEVEL_RANK = {"low": 0, "moderate": 1, "high": 2}


def _overall_level(readings: list[RiskReading]) -> str:
    if not readings:
        return "low"
    worst = max(readings, key=lambda r: LEVEL_RANK[r.risk])
    return worst.risk


async def build_disease_report(
    latitude: float, longitude: float, crop: str
) -> DiseaseResponse:
    hourly = await fetch_hourly_forecast(latitude=latitude, longitude=longitude)
    inputs = build_risk_inputs(hourly)
    readings = evaluate_crop(crop, inputs)
    overall = _overall_level(readings)

    ai_explanation = await generate_disease_explanation(
        crop=crop,
        overall_risk=overall,
        readings=[(r.name_en, r.risk, r.score) for r in readings],
    )

    return DiseaseResponse(
        crop=crop,
        latitude=hourly.latitude,
        longitude=hourly.longitude,
        forecast_start=inputs.days[0] if inputs.days else "",
        forecast_end=inputs.days[-1] if inputs.days else "",
        overall_risk=overall,  # type: ignore[arg-type]
        risks=[
            RiskReadingResponse(
                id=r.id,
                name_en=r.name_en,
                name_bs=r.name_bs,
                kind=r.kind,
                risk=r.risk,
                score=r.score,
                trigger_days=r.trigger_days,
                explanation=r.explanation,
                prevention=r.prevention,
            )
            for r in readings
        ],
        ai_explanation=ai_explanation,
    )
