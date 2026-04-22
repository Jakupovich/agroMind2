"""Disease and pest risk rule catalog.

Each crop maps to a list of well-known disease/pest risk models that can be
evaluated from hourly weather data. The rules used here are standard
agronomy forecasting heuristics published in plant-pathology literature:

* **Smith period** — potato late blight (*Phytophthora infestans*).
  A Smith period requires two consecutive days with min temp ≥ 10 °C and
  relative humidity ≥ 90 % for at least 11 hours on each day.
* **TOMCAST DSV** — tomato / pepper early blight (*Alternaria solani*).
  Disease Severity Values are accumulated from leaf-wetness duration and
  mean temperature during wetness; a 7-day sum is classified low/mod/high.
* **Septoria leaf blotch** — wheat / barley. Elevated risk on extended
  canopy wetness with mild temperatures.
* **Fusarium head blight** — wheat. Warm (≥ 15 °C) + humid at heading.
* **Northern leaf blight / Gray leaf spot** — corn. Mild temps + long
  leaf wetness windows.
* **Asian rust / Sclerotinia** — soy / sunflower / rapeseed.
* **Aphid pressure** — generic pest heuristic for warm dry spells.

All thresholds are deliberately conservative — the goal is to give the
farmer an early-warning traffic-light, not a diagnostic tool.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Literal

from app.services.weather import HourlyForecast

RiskLevel = Literal["low", "moderate", "high"]


@dataclass
class RiskInputs:
    """Hourly features aggregated into per-day summaries."""

    days: list[str]  # ISO dates (YYYY-MM-DD)
    mean_temp_c: list[float]
    min_temp_c: list[float]
    max_temp_c: list[float]
    precip_sum_mm: list[float]
    wet_hours: list[int]  # hours with leaf-wetness proxy (RH ≥ 87% or rain)
    high_rh_hours: list[int]  # hours with RH ≥ 90%
    mean_temp_during_wetness_c: list[float]


def build_risk_inputs(hourly: HourlyForecast) -> RiskInputs:
    """Aggregate raw hourly values into per-day features used by all rules."""
    per_day: dict[str, dict[str, list[float]]] = {}
    for i, ts in enumerate(hourly.times):
        day = ts[:10]
        bucket = per_day.setdefault(
            day,
            {"temp": [], "rh": [], "precip": []},
        )
        bucket["temp"].append(hourly.temperature_2m[i])
        bucket["rh"].append(hourly.relative_humidity_2m[i])
        bucket["precip"].append(hourly.precipitation[i])

    days = sorted(per_day.keys())
    mean_t: list[float] = []
    min_t: list[float] = []
    max_t: list[float] = []
    precip_sum: list[float] = []
    wet_hours: list[int] = []
    high_rh_hours: list[int] = []
    mean_t_during_wetness: list[float] = []

    for d in days:
        temp = per_day[d]["temp"]
        rh = per_day[d]["rh"]
        precip = per_day[d]["precip"]
        n = max(len(temp), 1)
        mean_t.append(sum(temp) / n)
        min_t.append(min(temp) if temp else 0.0)
        max_t.append(max(temp) if temp else 0.0)
        precip_sum.append(sum(precip))

        wet_mask = [
            (rh[i] >= 87.0) or (precip[i] > 0.1) for i in range(len(temp))
        ]
        wet_hours.append(int(sum(1 for w in wet_mask if w)))
        high_rh_hours.append(int(sum(1 for v in rh if v >= 90.0)))
        wet_temps = [temp[i] for i, w in enumerate(wet_mask) if w]
        mean_t_during_wetness.append(
            sum(wet_temps) / len(wet_temps) if wet_temps else 0.0
        )

    return RiskInputs(
        days=days,
        mean_temp_c=mean_t,
        min_temp_c=min_t,
        max_temp_c=max_t,
        precip_sum_mm=precip_sum,
        wet_hours=wet_hours,
        high_rh_hours=high_rh_hours,
        mean_temp_during_wetness_c=mean_t_during_wetness,
    )


@dataclass
class RiskReading:
    """A single disease/pest evaluation for one crop."""

    id: str
    name_en: str
    name_bs: str
    kind: Literal["disease", "pest"]
    risk: RiskLevel
    score: float  # 0–100 for UI meter
    trigger_days: list[str]  # ISO dates that pushed the risk up
    explanation: str
    prevention: list[str]


RuleFn = Callable[[RiskInputs], RiskReading]


# ---- rule implementations --------------------------------------------------


def _score_for(level: RiskLevel) -> float:
    return {"low": 20.0, "moderate": 55.0, "high": 85.0}[level]


def _bump(score: float, by: float) -> float:
    return min(100.0, round(score + by, 1))


def _smith_period_late_blight(inp: RiskInputs) -> RiskReading:
    """Potato late blight (Phytophthora infestans) via Smith periods."""
    qualifying_days: list[bool] = [
        inp.min_temp_c[i] >= 10.0 and inp.high_rh_hours[i] >= 11
        for i in range(len(inp.days))
    ]
    periods = 0
    triggers: list[str] = []
    for i in range(len(qualifying_days) - 1):
        if qualifying_days[i] and qualifying_days[i + 1]:
            periods += 1
            triggers.extend([inp.days[i], inp.days[i + 1]])
    triggers = sorted(set(triggers))
    if periods >= 2:
        level: RiskLevel = "high"
    elif periods == 1:
        level = "moderate"
    elif sum(1 for q in qualifying_days if q) >= 2:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), periods * 4)
    return RiskReading(
        id="late_blight",
        name_en="Late blight",
        name_bs="Plamenjača krompira",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"Found {periods} Smith period(s) in the 7-day window "
            f"(min temp ≥ 10 °C and RH ≥ 90 % for ≥ 11 h on two consecutive days)."
        ),
        prevention=[
            "Apply protectant fungicide (mancozeb / chlorothalonil) before the next Smith period.",
            "Avoid overhead irrigation late in the day — keep the canopy dry at night.",
            "Scout lower leaves for brown water-soaked lesions with white sporulation.",
        ],
    )


def _tomcast_early_blight(inp: RiskInputs) -> RiskReading:
    """TOMCAST-style DSV for tomato / pepper early blight."""

    def dsv_for(wet_h: int, mean_t: float) -> int:
        if wet_h <= 0:
            return 0
        if mean_t < 13:
            return 1 if wet_h >= 15 else 0
        if mean_t < 18:
            # 13–17 °C
            if wet_h >= 21:
                return 3
            if wet_h >= 13:
                return 2
            if wet_h >= 7:
                return 1
            return 0
        if mean_t < 21:
            # 18–20 °C
            if wet_h >= 18:
                return 4
            if wet_h >= 12:
                return 3
            if wet_h >= 7:
                return 2
            if wet_h >= 3:
                return 1
            return 0
        if mean_t < 25:
            # 21–24 °C
            if wet_h >= 15:
                return 4
            if wet_h >= 10:
                return 3
            if wet_h >= 6:
                return 2
            if wet_h >= 3:
                return 1
            return 0
        # ≥ 25 °C
        if wet_h >= 14:
            return 3
        if wet_h >= 9:
            return 2
        if wet_h >= 4:
            return 1
        return 0

    dsv_values = [
        dsv_for(inp.wet_hours[i], inp.mean_temp_during_wetness_c[i])
        for i in range(len(inp.days))
    ]
    total_dsv = sum(dsv_values)
    triggers = [inp.days[i] for i, v in enumerate(dsv_values) if v >= 3]
    if total_dsv >= 15:
        level: RiskLevel = "high"
    elif total_dsv >= 8:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), min(total_dsv * 1.5, 20))
    return RiskReading(
        id="early_blight",
        name_en="Early blight (TOMCAST)",
        name_bs="Rana plamenjača (TOMCAST)",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"7-day TOMCAST DSV accumulation: {total_dsv}. "
            "Thresholds: <8 low, 8–14 moderate, ≥15 high."
        ),
        prevention=[
            "Start a 7-day fungicide interval when DSV ≥ 15 in the forecast.",
            "Remove lower infected leaves and improve airflow between plants.",
            "Mulch to reduce soil splash onto the lowest foliage.",
        ],
    )


def _septoria_risk(inp: RiskInputs) -> RiskReading:
    """Septoria leaf blotch on wheat / barley."""
    qualifying = [
        inp.wet_hours[i] >= 12
        and 10.0 <= inp.mean_temp_during_wetness_c[i] <= 22.0
        for i in range(len(inp.days))
    ]
    count = sum(1 for q in qualifying if q)
    triggers = [inp.days[i] for i, q in enumerate(qualifying) if q]
    if count >= 3:
        level: RiskLevel = "high"
    elif count >= 1:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), count * 3)
    return RiskReading(
        id="septoria",
        name_en="Septoria leaf blotch",
        name_bs="Septorija (pjegavost lista)",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"{count} day(s) with ≥12 h leaf wetness at 10–22 °C in the forecast."
        ),
        prevention=[
            "Apply triazole-based fungicide at T1 (first node) if risk stays moderate+.",
            "Stretch the interval between irrigation events during wet weeks.",
            "Rotate with non-cereal crops to break the inoculum cycle.",
        ],
    )


def _fusarium_head_blight(inp: RiskInputs) -> RiskReading:
    """Fusarium head blight on wheat, focused on warm humid flowering days."""
    qualifying = [
        inp.mean_temp_c[i] >= 15.0 and inp.high_rh_hours[i] >= 8
        for i in range(len(inp.days))
    ]
    count = sum(1 for q in qualifying if q)
    triggers = [inp.days[i] for i, q in enumerate(qualifying) if q]
    if count >= 3:
        level: RiskLevel = "high"
    elif count >= 1:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), count * 4)
    return RiskReading(
        id="fusarium",
        name_en="Fusarium head blight",
        name_bs="Fuzarijum klasa",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"{count} day(s) with ≥ 15 °C and ≥ 8 h of RH ≥ 90 % during heading."
        ),
        prevention=[
            "Apply prothioconazole + tebuconazole at early anthesis (BBCH 61–65).",
            "Scout for bleached spikelets and pink/orange fungal bodies.",
            "Harvest promptly and dry grain below 14 % moisture.",
        ],
    )


def _northern_leaf_blight(inp: RiskInputs) -> RiskReading:
    """Northern leaf blight on corn — long leaf wetness at moderate temps."""
    qualifying = [
        inp.wet_hours[i] >= 10
        and 18.0 <= inp.mean_temp_during_wetness_c[i] <= 27.0
        for i in range(len(inp.days))
    ]
    count = sum(1 for q in qualifying if q)
    triggers = [inp.days[i] for i, q in enumerate(qualifying) if q]
    if count >= 3:
        level: RiskLevel = "high"
    elif count >= 1:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), count * 3)
    return RiskReading(
        id="northern_leaf_blight",
        name_en="Northern leaf blight",
        name_bs="Plamenjača kukuruza",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"{count} day(s) with ≥ 10 h leaf wetness at 18–27 °C in the forecast."
        ),
        prevention=[
            "Plant tolerant hybrids on fields with history of NLB.",
            "Apply fungicide at VT (tasseling) when risk reaches high.",
            "Shred and bury residue to reduce overwintering spore load.",
        ],
    )


def _rust_risk(inp: RiskInputs) -> RiskReading:
    """Generic rust pressure (soy rust / cereal rust / sunflower rust)."""
    qualifying = [
        inp.wet_hours[i] >= 6
        and 16.0 <= inp.mean_temp_during_wetness_c[i] <= 28.0
        for i in range(len(inp.days))
    ]
    count = sum(1 for q in qualifying if q)
    triggers = [inp.days[i] for i, q in enumerate(qualifying) if q]
    if count >= 4:
        level: RiskLevel = "high"
    elif count >= 2:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), count * 2)
    return RiskReading(
        id="rust",
        name_en="Rust (Puccinia spp.)",
        name_bs="Rđa (Puccinia spp.)",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"{count} day(s) with ≥ 6 h of dew-friendly conditions (16–28 °C) in the forecast."
        ),
        prevention=[
            "Scout leaf undersides for orange/brown pustules; treat at first sighting.",
            "Rotate strobilurin + triazole chemistry to slow resistance.",
            "Improve canopy ventilation — wider rows dry faster.",
        ],
    )


def _sclerotinia_stem_rot(inp: RiskInputs) -> RiskReading:
    """Sclerotinia white mold for rapeseed / sunflower / soy."""
    qualifying = [
        inp.high_rh_hours[i] >= 10
        and 15.0 <= inp.mean_temp_c[i] <= 24.0
        and inp.precip_sum_mm[i] >= 1.0
        for i in range(len(inp.days))
    ]
    count = sum(1 for q in qualifying if q)
    triggers = [inp.days[i] for i, q in enumerate(qualifying) if q]
    if count >= 3:
        level: RiskLevel = "high"
    elif count >= 1:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), count * 4)
    return RiskReading(
        id="sclerotinia",
        name_en="Sclerotinia white mold",
        name_bs="Bijela trulež (Sclerotinia)",
        kind="disease",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"{count} day(s) at 15–24 °C with ≥ 10 h of RH ≥ 90 % and some rain in the forecast."
        ),
        prevention=[
            "Apply boscalid + dimoxystrobin at 20–50 % flowering.",
            "Widen rows to break the dense-canopy microclimate.",
            "Avoid back-to-back canola / sunflower / soy rotations.",
        ],
    )


def _aphid_pressure(inp: RiskInputs) -> RiskReading:
    """Generic aphid pressure heuristic — warm dry spells accelerate growth."""
    qualifying = [
        20.0 <= inp.mean_temp_c[i] <= 28.0 and inp.precip_sum_mm[i] < 1.0
        for i in range(len(inp.days))
    ]
    count = sum(1 for q in qualifying if q)
    triggers = [inp.days[i] for i, q in enumerate(qualifying) if q]
    if count >= 5:
        level: RiskLevel = "high"
    elif count >= 3:
        level = "moderate"
    else:
        level = "low"
    score = _bump(_score_for(level), count * 2)
    return RiskReading(
        id="aphids",
        name_en="Aphid pressure",
        name_bs="Pritisak lisnih uši",
        kind="pest",
        risk=level,
        score=score,
        trigger_days=triggers,
        explanation=(
            f"{count} warm dry day(s) at 20–28 °C with < 1 mm rain in the forecast."
        ),
        prevention=[
            "Scout flag leaves weekly; treat when ≥ 20 aphids / tiller.",
            "Preserve beneficials (ladybugs, lacewings) — rotate insecticide modes.",
            "Avoid excess nitrogen, which boosts aphid fecundity.",
        ],
    )


# ---- crop → rules mapping --------------------------------------------------

CROP_RULES: dict[str, list[RuleFn]] = {
    "potato": [_smith_period_late_blight, _aphid_pressure],
    "potatoes": [_smith_period_late_blight, _aphid_pressure],
    "tomato": [_tomcast_early_blight, _aphid_pressure],
    "pepper": [_tomcast_early_blight, _aphid_pressure],
    "wheat": [_septoria_risk, _fusarium_head_blight, _rust_risk, _aphid_pressure],
    "barley": [_septoria_risk, _rust_risk, _aphid_pressure],
    "corn": [_northern_leaf_blight, _aphid_pressure],
    "maize": [_northern_leaf_blight, _aphid_pressure],
    "soy": [_rust_risk, _sclerotinia_stem_rot, _aphid_pressure],
    "soya": [_rust_risk, _sclerotinia_stem_rot, _aphid_pressure],
    "soybean": [_rust_risk, _sclerotinia_stem_rot, _aphid_pressure],
    "soybeans": [_rust_risk, _sclerotinia_stem_rot, _aphid_pressure],
    "sunflower": [_rust_risk, _sclerotinia_stem_rot, _aphid_pressure],
    "rapeseed": [_sclerotinia_stem_rot, _aphid_pressure],
    "onion": [_aphid_pressure],
}


def supported_crops() -> list[str]:
    """Canonical list of crops the disease predictor understands."""
    return sorted({
        "potato",
        "tomato",
        "pepper",
        "wheat",
        "barley",
        "corn",
        "soybeans",
        "sunflower",
        "rapeseed",
        "onion",
    })


def evaluate_crop(crop: str, inp: RiskInputs) -> list[RiskReading]:
    """Run every rule registered for ``crop`` against the weather inputs."""
    key = crop.strip().lower()
    rules = CROP_RULES.get(key)
    if not rules:
        # Fall back to a minimal pest screen so the endpoint never 404s on
        # an unknown-but-valid crop name.
        rules = [_aphid_pressure]
    return [rule(inp) for rule in rules]
