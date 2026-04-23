import type { PredictionResponse } from "@/services/agroPredictService";
import type { DiseaseResponse } from "@/services/diseaseService";
import type { IrrigationResponse } from "@/services/irrigationService";
import type { WeatherData } from "@/services/weatherService";
import { useMemo } from "react";

/**
 * Dynamic Climate Resilience Score computed from the live AI signals the
 * dashboard is already rendering.
 *
 * Baseline 100. Points are subtracted by verifiable risk signals:
 *  - every frost-risk day across all crops: −3
 *  - each moderate disease window: −2; each high disease window: −5
 *  - irrigation status moderate: −5, urgent: −12
 *  - current temperature > 33 °C (heat stress): −6
 *  - wind gusts > 60 km/h (hail/lodging): −4
 *
 * Clamped to [20, 100] so the UI never shows a demoralising zero.
 */
export function useClimateScore(
  weather: WeatherData | null,
  frost: PredictionResponse | null,
  diseases: DiseaseResponse[] | null,
  irrigation: IrrigationResponse | null,
): { score: number; label: "excellent" | "moderate" | "high_risk" } {
  return useMemo(() => {
    let score = 100;

    if (frost?.predictions) {
      for (const pred of frost.predictions) {
        score -= (pred.risk.crop_frost_risk_days_14d ?? 0) * 3;
      }
    }

    if (diseases) {
      for (const report of diseases) {
        for (const d of report.risks) {
          if (d.risk === "moderate") score -= 2;
          else if (d.risk === "high") score -= 5;
        }
      }
    }

    if (irrigation) {
      if (irrigation.status === "moderate") score -= 5;
      else if (irrigation.status === "urgent") score -= 12;
    }

    if (weather?.current) {
      if (weather.current.temperature > 33) score -= 6;
      if (weather.current.windSpeed > 60) score -= 4;
    }

    score = Math.max(20, Math.min(100, Math.round(score)));
    const label: "excellent" | "moderate" | "high_risk" =
      score >= 75 ? "excellent" : score >= 55 ? "moderate" : "high_risk";

    return { score, label };
  }, [weather, frost, diseases, irrigation]);
}
