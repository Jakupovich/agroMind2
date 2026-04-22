/**
 * AgroMind backend API client — disease & pest predictor.
 *
 * Shares the same base-URL resolution chain as `irrigationService`:
 *   1. `EXPO_PUBLIC_API_BASE_URL`
 *   2. `expo.extra.apiBaseUrl` from `app.json`
 *   3. Hard-coded Railway production URL.
 */
import { getApiBaseUrl } from "@/services/irrigationService";

export type RiskLevel = "low" | "moderate" | "high";
export type RiskKind = "disease" | "pest";

export interface RiskReading {
  id: string;
  name_en: string;
  name_bs: string;
  kind: RiskKind;
  risk: RiskLevel;
  score: number;
  trigger_days: string[];
  explanation: string;
  prevention: string[];
}

export interface DiseaseResponse {
  crop: string;
  latitude: number;
  longitude: number;
  forecast_start: string;
  forecast_end: string;
  overall_risk: RiskLevel;
  risks: RiskReading[];
  ai_explanation: string;
}

export async function fetchDiseaseRisk(
  lat: number,
  lon: number,
  crop: string,
  signal?: AbortSignal,
): Promise<DiseaseResponse> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    crop,
  });
  const url = `${baseUrl}/disease?${params}`;

  if (__DEV__) {
    console.log("[disease] GET", url);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network request failed for ${url}: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Disease API error ${response.status} at ${url}${body ? `: ${body}` : ""}`,
    );
  }

  return (await response.json()) as DiseaseResponse;
}

export function riskColorKey(level: RiskLevel): "green" | "amber" | "red" {
  if (level === "low") return "green";
  if (level === "moderate") return "amber";
  return "red";
}

export function riskLabel(level: RiskLevel): string {
  if (level === "low") return "Low";
  if (level === "moderate") return "Moderate";
  return "High";
}
