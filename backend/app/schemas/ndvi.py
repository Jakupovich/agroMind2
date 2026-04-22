from __future__ import annotations

from pydantic import BaseModel, Field


class NDVIStats(BaseModel):
    mean: float = Field(..., description="Mean NDVI across the field patch (-1..1).")
    min: float
    max: float
    stdev: float
    valid_pixel_ratio: float = Field(
        ..., description="Fraction of pixels that passed the cloud/SCL mask (0..1)."
    )


class NDVIResponse(BaseModel):
    latitude: float
    longitude: float
    box_meters: int = Field(
        ..., description="Edge length (metres) of the square patch analysed."
    )
    acquisition_date: str | None = Field(
        default=None,
        description=(
            "ISO date of the Sentinel-2 acquisition used for analysis, "
            "or null if the scene date could not be determined."
        ),
    )
    cloud_coverage: float | None = Field(
        default=None, description="Estimated cloud fraction in the requested window (0..1)."
    )
    stats: NDVIStats
    traffic_light: str = Field(
        ..., description="'green' (healthy), 'amber' (stressed) or 'red' (bare/water)."
    )
    score_label: str = Field(..., description="Human-readable health label.")
    explanation: list[str] = Field(
        ..., description="Short bullet-point interpretation for farmers."
    )
    image_png_base64: str = Field(
        ...,
        description="Base64-encoded PNG of the NDVI colour-ramp preview (512x512).",
    )
