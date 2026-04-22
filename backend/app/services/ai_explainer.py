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
