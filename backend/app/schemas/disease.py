from typing import Literal

from pydantic import BaseModel, Field

RiskLevel = Literal["low", "moderate", "high"]
RiskKind = Literal["disease", "pest"]


class RiskReadingResponse(BaseModel):
    """One disease or pest evaluation for a crop."""

    id: str = Field(..., description="Stable identifier (e.g. 'late_blight').")
    name_en: str = Field(..., description="Human-readable name in English.")
    name_bs: str = Field(..., description="Human-readable name in Bosnian.")
    kind: RiskKind = Field(..., description="Whether this is a disease or a pest pressure entry.")
    risk: RiskLevel = Field(..., description="Traffic-light risk level.")
    score: float = Field(..., ge=0, le=100, description="0–100 severity score for UI meters.")
    trigger_days: list[str] = Field(
        default_factory=list,
        description="ISO dates within the forecast window that triggered the model.",
    )
    explanation: str = Field(..., description="Short plain-language explanation of the model output.")
    prevention: list[str] = Field(
        default_factory=list,
        description="Actionable prevention / mitigation bullet points.",
    )


class DiseaseResponse(BaseModel):
    """Response payload for the disease & pest predictor."""

    crop: str = Field(..., description="Crop the risk report is for.", examples=["potato"])
    latitude: float = Field(..., description="Latitude the forecast was pulled for.")
    longitude: float = Field(..., description="Longitude the forecast was pulled for.")
    forecast_start: str = Field(..., description="First ISO date in the evaluated window.")
    forecast_end: str = Field(..., description="Last ISO date in the evaluated window.")
    overall_risk: RiskLevel = Field(..., description="Worst risk level across the per-disease list.")
    risks: list[RiskReadingResponse] = Field(
        default_factory=list,
        description="All disease and pest evaluations for this crop.",
    )
    ai_explanation: str = Field(
        ...,
        description="Short natural-language summary of the risk report.",
    )
