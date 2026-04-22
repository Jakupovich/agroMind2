from __future__ import annotations

import logging

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.schemas.ndvi import NDVIResponse
from app.services.ndvi import fetch_ndvi

logger = logging.getLogger(__name__)

ndvi_router = APIRouter(prefix="", tags=["ndvi"])


@ndvi_router.get(
    "/ndvi",
    response_model=NDVIResponse,
    summary="Satellite NDVI for a field patch",
    description=(
        "Returns a traffic-light NDVI health score and a 512x512 PNG preview for a "
        "square patch centred on the given coordinates, using the latest low-cloud "
        "Sentinel-2 acquisition from Copernicus Data Space Ecosystem."
    ),
)
async def get_ndvi(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    box_meters: int = Query(500, ge=100, le=5000),
    lookback_days: int = Query(30, ge=7, le=120),
) -> NDVIResponse:
    try:
        data = await fetch_ndvi(
            lat=lat,
            lon=lon,
            box_meters=box_meters,
            lookback_days=lookback_days,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "CDSE API returned %s: %s", exc.response.status_code, exc.response.text[:400]
        )
        raise HTTPException(
            status_code=502,
            detail=f"Satellite provider error ({exc.response.status_code}).",
        ) from exc
    except httpx.HTTPError as exc:
        logger.warning("CDSE API transport error: %s", exc)
        raise HTTPException(
            status_code=504, detail="Satellite provider is unreachable."
        ) from exc
    return NDVIResponse.model_validate(data)
