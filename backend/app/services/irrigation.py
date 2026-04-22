"""Smart irrigation recommendation service.

Encapsulates the water-deficit computation and thresholding rules that
turn a 7-day weather forecast into an actionable irrigation plan.
"""
from app.schemas.irrigation import IrrigationResponse, IrrigationStatus
from app.services.ai_explainer import generate_irrigation_explanation
from app.services.weather import WeeklyForecast, fetch_weekly_forecast

# Deficit thresholds in millimetres over the 7-day horizon.
GOOD_THRESHOLD_MM = 5.0
MODERATE_THRESHOLD_MM = 15.0


def _classify(cumulative_deficit: float) -> IrrigationStatus:
    if cumulative_deficit <= GOOD_THRESHOLD_MM:
        return "good"
    if cumulative_deficit <= MODERATE_THRESHOLD_MM:
        return "moderate"
    return "urgent"


def _compute_deficit(forecast: WeeklyForecast) -> tuple[float, float]:
    """Return (cumulative_deficit_mm, peak_max_temperature_c)."""
    cumulative = 0.0
    peak_temp = float("-inf")
    for day in forecast.days:
        cumulative += day.et0_fao_evapotranspiration - day.precipitation_sum
        if day.temperature_2m_max > peak_temp:
            peak_temp = day.temperature_2m_max
    if peak_temp == float("-inf"):
        peak_temp = 0.0
    return cumulative, peak_temp


async def build_irrigation_recommendation(
    latitude: float,
    longitude: float,
    crop: str,
) -> IrrigationResponse:
    forecast = await fetch_weekly_forecast(latitude=latitude, longitude=longitude)
    cumulative_deficit, peak_temp = _compute_deficit(forecast)
    status = _classify(cumulative_deficit)

    irrigation_needed = status != "good"
    recommended_mm = round(max(cumulative_deficit, 0.0), 1) if irrigation_needed else 0.0

    explanation = await generate_irrigation_explanation(
        crop=crop,
        cumulative_deficit=cumulative_deficit,
        max_temperature=peak_temp,
        status=status,
    )

    return IrrigationResponse(
        crop=crop,
        irrigation_needed=irrigation_needed,
        recommended_mm=recommended_mm,
        status=status,
        cumulative_deficit=round(cumulative_deficit, 1),
        ai_explanation=explanation,
    )
