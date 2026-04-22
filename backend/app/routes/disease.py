from fastapi import APIRouter, Query

from app.schemas.disease import DiseaseResponse
from app.services.disease import build_disease_report
from app.services.disease_rules import supported_crops

router = APIRouter(tags=["disease"])


@router.get(
    "/disease",
    response_model=DiseaseResponse,
    summary="Disease & pest risk predictor",
    description=(
        "Given a latitude/longitude and crop, pulls a 7-day hourly Open-Meteo "
        "forecast, evaluates crop-specific disease and pest models "
        "(Smith periods for potato late blight, TOMCAST DSV for tomato early "
        "blight, Septoria, Fusarium, rust, Sclerotinia, etc.) and returns a "
        "traffic-light risk report with prevention tips."
    ),
)
async def get_disease(
    lat: float = Query(..., ge=-90, le=90, description="Latitude in decimal degrees."),
    lon: float = Query(..., ge=-180, le=180, description="Longitude in decimal degrees."),
    crop: str = Query(..., min_length=1, max_length=64, description="Crop name, e.g. 'potato'."),
) -> DiseaseResponse:
    return await build_disease_report(latitude=lat, longitude=lon, crop=crop)


@router.get(
    "/disease/crops",
    summary="Supported crops for the disease & pest predictor",
    description="Canonical list of crop identifiers with registered disease/pest rules.",
)
async def get_supported_crops() -> dict[str, list[str]]:
    return {"crops": supported_crops()}
