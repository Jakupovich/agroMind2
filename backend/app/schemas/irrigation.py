from typing import Literal

from pydantic import BaseModel, Field

IrrigationStatus = Literal["good", "moderate", "urgent"]


class IrrigationResponse(BaseModel):
    """Response payload for the smart irrigation recommendation endpoint."""

    crop: str = Field(..., description="Crop name the recommendation is for.", examples=["corn"])
    irrigation_needed: bool = Field(
        ..., description="Whether the field should be irrigated in the next 24 hours."
    )
    recommended_mm: float = Field(
        ...,
        ge=0,
        description="Recommended amount of irrigation water in millimetres.",
        examples=[18.4],
    )
    status: IrrigationStatus = Field(
        ..., description="Qualitative irrigation status: good, moderate, or urgent."
    )
    cumulative_deficit: float = Field(
        ...,
        description="Sum of (ET0 - precipitation) over the next 7 days, in mm.",
        examples=[18.4],
    )
    ai_explanation: str = Field(
        ...,
        description="Short natural-language explanation of the recommendation.",
    )
