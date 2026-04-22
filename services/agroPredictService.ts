/**
 * Agro-Predict AI API client — frost risk + planting-date recommendation.
 *
 * Base URL resolution order (same convention as irrigationService):
 *   1. `process.env.EXPO_PUBLIC_AGRO_PREDICT_URL` (root `.env`, cache-cleared restart)
 *   2. `expo.extra.agroPredictUrl` from `app.json` via `expo-constants`
 *   3. Hard-coded Railway production URL
 *
 * Live docs: https://agro-predict-production.up.railway.app/docs
 */
import Constants from "expo-constants";

export type TrafficLight = "green" | "yellow" | "red";
export type FrostTolerance = "none" | "low" | "moderate";

export interface Crop {
  id: string;
  name_en: string;
  name_bs: string;
}

export interface CropDetail extends Crop {
  frost_tolerance: FrostTolerance;
  growing_days: number;
}

export interface DailyForecast {
  date: string;
  temp_min_c: number;
  temp_max_c: number;
  precipitation_mm: number;
  frost_probability: number;
  crop_frost_risk: boolean;
}

export interface RecommendedPlanting {
  date: string | null;
  confidence: number;
  historical_frost_rate: number;
  forecast_frost_probability: number;
  window_start: string;
  window_end: string;
}

export interface Risk {
  traffic_light: TrafficLight;
  label: string;
  avg_frost_probability_14d: number;
  max_frost_probability_14d: number;
  crop_frost_risk_days_14d: number;
}

export interface Confidence {
  overall: number;
  model_auc: number;
  historical_coverage: number;
}

export interface CropPrediction {
  crop: CropDetail;
  recommended_planting: RecommendedPlanting;
  risk: Risk;
  forecast_14d: DailyForecast[];
  confidence: Confidence;
  explanation: string[];
  gpt_explanation?: string[];
  gpt_model?: string;
}

export interface PredictionResponse {
  location: {
    latitude: number;
    longitude: number;
    elevation_m: number;
  };
  predictions: CropPrediction[];
  gpt_enabled: boolean;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_auc: number | null;
  gpt_configured: boolean;
  gpt_model: string | null;
}

const PRODUCTION_FALLBACK_URL = "https://agro-predict-production.up.railway.app";

export function getAgroPredictBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_AGRO_PREDICT_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/+$/, "");
  }

  const fromManifest = (
    Constants.expoConfig?.extra as { agroPredictUrl?: string } | undefined
  )?.agroPredictUrl;
  if (fromManifest && fromManifest.trim().length > 0) {
    return fromManifest.trim().replace(/\/+$/, "");
  }

  return PRODUCTION_FALLBACK_URL;
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = `${getAgroPredictBaseUrl()}${path}`;
  if (__DEV__) {
    console.log("[agro-predict] GET", url);
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
      `Agro-Predict API error ${response.status} at ${url}${body ? `: ${body}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

export async function fetchCrops(signal?: AbortSignal): Promise<Crop[]> {
  const data = await request<{ crops: Crop[] }>("/crops", signal);
  return data.crops;
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("/health", signal);
}

export interface PredictParams {
  lat: number;
  lon: number;
  cropIds: string[];
  lang?: "bs" | "en";
  useGpt?: boolean;
  signal?: AbortSignal;
}

export async function fetchPrediction(
  p: PredictParams,
): Promise<PredictionResponse> {
  if (p.cropIds.length === 0) {
    throw new Error("fetchPrediction requires at least one crop id");
  }
  const params = new URLSearchParams({
    lat: p.lat.toString(),
    lon: p.lon.toString(),
    crop: p.cropIds.join(","),
    lang: p.lang ?? "en",
    use_gpt: String(p.useGpt ?? true),
  });
  return request<PredictionResponse>(`/predict?${params}`, p.signal);
}

export function trafficLightColorKey(
  light: TrafficLight,
): "green" | "amber" | "red" {
  if (light === "green") return "green";
  if (light === "yellow") return "amber";
  return "red";
}

export function trafficLightLabel(light: TrafficLight): string {
  if (light === "green") return "Safe to plant";
  if (light === "yellow") return "Monitor closely";
  return "Delay planting";
}
