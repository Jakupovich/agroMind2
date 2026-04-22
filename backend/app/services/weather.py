"""Open-Meteo weather client.

Thin async wrapper around the Open-Meteo forecast API. Kept small and
generic so future features (frost prediction, pest pressure, etc.) can
reuse it without pulling in feature-specific logic.
"""
from dataclasses import dataclass

import httpx
from fastapi import HTTPException, status

from app.core.config import get_settings


@dataclass
class DailyForecast:
    date: str
    precipitation_sum: float
    et0_fao_evapotranspiration: float
    temperature_2m_max: float


@dataclass
class WeeklyForecast:
    latitude: float
    longitude: float
    days: list[DailyForecast]


async def fetch_weekly_forecast(latitude: float, longitude: float) -> WeeklyForecast:
    """Fetch a 7-day daily forecast from Open-Meteo.

    Requests precipitation, FAO reference evapotranspiration (ET0) and
    max temperature — the fields required by irrigation planning.
    """
    settings = get_settings()
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "daily": ",".join(
            [
                "precipitation_sum",
                "et0_fao_evapotranspiration",
                "temperature_2m_max",
            ]
        ),
        "forecast_days": 7,
        "timezone": "auto",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.http_timeout_seconds) as client:
            response = await client.get(settings.open_meteo_base_url, params=params)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch weather data from Open-Meteo: {exc}",
        ) from exc

    payload = response.json()
    daily = payload.get("daily") or {}
    dates: list[str] = daily.get("time") or []
    precips: list[float | None] = daily.get("precipitation_sum") or []
    et0s: list[float | None] = daily.get("et0_fao_evapotranspiration") or []
    tmaxs: list[float | None] = daily.get("temperature_2m_max") or []

    if not dates:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Open-Meteo returned no daily forecast data.",
        )

    days = [
        DailyForecast(
            date=dates[i],
            precipitation_sum=float(precips[i] or 0.0),
            et0_fao_evapotranspiration=float(et0s[i] or 0.0),
            temperature_2m_max=float(tmaxs[i] or 0.0),
        )
        for i in range(len(dates))
    ]

    return WeeklyForecast(
        latitude=float(payload.get("latitude", latitude)),
        longitude=float(payload.get("longitude", longitude)),
        days=days,
    )
