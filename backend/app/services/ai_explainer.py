"""AI explanation generator.

Uses OpenAI when an API key is configured, otherwise falls back to a
deterministic rule-based template. Either way the output is a short,
user-facing sentence suitable for a dashboard card.
"""
from __future__ import annotations

import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _rule_based_explanation(
    crop: str,
    cumulative_deficit: float,
    max_temperature: float,
    status: str,
) -> str:
    crop_label = crop.capitalize()
    deficit = round(cumulative_deficit, 1)

    if status == "good":
        return (
            f"{crop_label} shows a balanced water budget over the next 7 days "
            f"(deficit {deficit} mm). Rainfall covers evapotranspiration, so no "
            f"irrigation is needed."
        )
    if status == "moderate":
        return (
            f"{crop_label} shows a water deficit of {deficit} mm over the next 7 "
            f"days with highs near {round(max_temperature)}°C. A moderate "
            f"irrigation of {deficit} mm is recommended within the next few days."
        )
    return (
        f"{crop_label} shows a water deficit of {deficit} mm over the next 7 days. "
        f"Due to high evapotranspiration (peaks near {round(max_temperature)}°C) "
        f"and low rainfall, irrigation is recommended within 24 hours."
    )


async def generate_irrigation_explanation(
    crop: str,
    cumulative_deficit: float,
    max_temperature: float,
    status: str,
) -> str:
    """Return a short explanation of the irrigation recommendation.

    Falls back to the rule-based template when OpenAI is unavailable or
    raises an error — the endpoint should never fail because of the
    explainer.
    """
    settings = get_settings()
    fallback = _rule_based_explanation(crop, cumulative_deficit, max_temperature, status)

    if not settings.openai_api_key:
        return fallback

    try:
        # Imported lazily so the dependency is optional at runtime.
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        prompt = (
            "You are an agronomy assistant. In 1-2 short sentences, explain an "
            "irrigation recommendation to a farmer. Be concrete and actionable. "
            f"Crop: {crop}. 7-day cumulative water deficit (ET0 - precipitation): "
            f"{cumulative_deficit:.1f} mm. Peak max temperature: "
            f"{max_temperature:.1f} C. Status: {status}."
        )
        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You write concise farming advice."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=120,
            temperature=0.4,
        )
        content = (completion.choices[0].message.content or "").strip()
        return content or fallback
    except Exception:  # noqa: BLE001 — never break the API on AI errors
        logger.exception("OpenAI explanation failed; using rule-based fallback")
        return fallback


def _rule_based_disease_explanation(
    crop: str,
    overall_risk: str,
    readings: list[tuple[str, str, float]],
) -> str:
    crop_label = crop.capitalize()
    high = [name for (name, level, _) in readings if level == "high"]
    moderate = [name for (name, level, _) in readings if level == "moderate"]
    if overall_risk == "high" and high:
        threats = ", ".join(high)
        return (
            f"{crop_label} is under high pressure from {threats} over the next 7 days. "
            "Start a protectant treatment now and scout the field daily."
        )
    if overall_risk == "moderate" and (high or moderate):
        threats = ", ".join(high + moderate)
        return (
            f"{crop_label} shows moderate risk from {threats} in the coming week. "
            "Keep the canopy dry, scout twice this week, and prepare a treatment plan."
        )
    return (
        f"{crop_label} shows low overall disease and pest pressure over the next 7 days. "
        "Continue routine scouting; no immediate intervention needed."
    )


async def generate_disease_explanation(
    crop: str,
    overall_risk: str,
    readings: list[tuple[str, str, float]],
) -> str:
    """Return a short 1-2 sentence summary of a disease/pest risk report.

    Falls back to a deterministic rule-based template when OpenAI is
    unavailable — the endpoint should never fail because of the explainer.
    """
    settings = get_settings()
    fallback = _rule_based_disease_explanation(crop, overall_risk, readings)

    if not settings.openai_api_key:
        return fallback

    try:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        bullet_list = "\n".join(
            f"- {name}: {level} (score {score:.0f}/100)"
            for (name, level, score) in readings
        ) or "- (no risk models matched this crop)"
        prompt = (
            "You are an agronomy assistant. In 1-2 short sentences, summarise "
            "a disease and pest risk report for a farmer. Be concrete and "
            f"actionable. Crop: {crop}. Overall risk: {overall_risk}.\n"
            "Per-model breakdown:\n"
            f"{bullet_list}"
        )
        completion = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": "You write concise farming advice."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=160,
            temperature=0.4,
        )
        content = (completion.choices[0].message.content or "").strip()
        return content or fallback
    except Exception:  # noqa: BLE001
        logger.exception("OpenAI disease explanation failed; using rule-based fallback")
        return fallback
