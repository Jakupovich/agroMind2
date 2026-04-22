from fastapi import APIRouter, Query

from app.schemas.irrigation import IrrigationResponse
from app.services.irrigation import build_irrigation_recommendation

router = APIRouter(tags=["irrigation"])


@router.get(
    "/irrigation",
    response_model=IrrigationResponse,
    summary="Smart irrigation recommendation",
    description=(
        "Given a latitude/longitude and crop, fetches a 7-day Open-Meteo "
        "forecast, computes the cumulative water deficit "
        "(ET0 − precipitation), and returns an irrigation recommendation "
        "together with a short AI explanation."
    ),
)
async def get_irrigation(
    lat: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees."),
    lon: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees."),
    crop: str = Query(..., min_length=1, max_length=64, description="Crop name, e.g. 'corn'."),
) -> IrrigationResponse:
    return await build_irrigation_recommendation(latitude=lat, longitude=lon, crop=crop)
