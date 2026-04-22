/**
 * AgroMind backend API client — smart irrigation.
 *
 * Base URL is read from the Expo public env var `EXPO_PUBLIC_API_BASE_URL`.
 * When unset (e.g. local dev without a `.env`) we fall back to the production
 * Railway URL if available, otherwise `http://localhost:8000`.
 */

export type IrrigationStatus = "good" | "moderate" | "urgent";

export interface IrrigationResponse {
  crop: string;
  irrigation_needed: boolean;
  recommended_mm: number;
  status: IrrigationStatus;
  cumulative_deficit: number;
  ai_explanation: string;
}

const FALLBACK_BASE_URL = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (raw && raw.trim().length > 0) {
    return raw.replace(/\/+$/, "");
  }
  return FALLBACK_BASE_URL;
}

export async function fetchIrrigation(
  lat: number,
  lon: number,
  crop: string,
  signal?: AbortSignal,
): Promise<IrrigationResponse> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    crop,
  });

  const response = await fetch(`${getApiBaseUrl()}/irrigation?${params}`, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Irrigation API error ${response.status}${body ? `: ${body}` : ""}`,
    );
  }

  return (await response.json()) as IrrigationResponse;
}

export function statusColorKey(status: IrrigationStatus): "green" | "amber" | "red" {
  if (status === "good") return "green";
  if (status === "moderate") return "amber";
  return "red";
}

export function statusLabel(status: IrrigationStatus): string {
  if (status === "good") return "Good";
  if (status === "moderate") return "Moderate";
  return "Urgent";
}
