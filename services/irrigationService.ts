/**
 * AgroMind backend API client — smart irrigation.
 *
 * API base URL is resolved in this order:
 *   1. `process.env.EXPO_PUBLIC_API_BASE_URL` (set via a root `.env` file;
 *      requires a cache-cleared Expo restart — `npx expo start -c`).
 *   2. `expo.extra.apiBaseUrl` from `app.json` (baked into the binary, so
 *      it always reaches native builds and Expo Go).
 *   3. Hard-coded Railway production URL as a last-resort fallback.
 */
import Constants from "expo-constants";

export type IrrigationStatus = "good" | "moderate" | "urgent";

export interface IrrigationResponse {
  crop: string;
  irrigation_needed: boolean;
  recommended_mm: number;
  status: IrrigationStatus;
  cumulative_deficit: number;
  ai_explanation: string;
}

const PRODUCTION_FALLBACK_URL = "https://agromind2-production.up.railway.app";

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.trim().replace(/\/+$/, "");
  }

  const fromManifest = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)
    ?.apiBaseUrl;
  if (fromManifest && fromManifest.trim().length > 0) {
    return fromManifest.trim().replace(/\/+$/, "");
  }

  return PRODUCTION_FALLBACK_URL;
}

export async function fetchIrrigation(
  lat: number,
  lon: number,
  crop: string,
  signal?: AbortSignal,
): Promise<IrrigationResponse> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    crop,
  });
  const url = `${baseUrl}/irrigation?${params}`;

  if (__DEV__) {
    console.log("[irrigation] GET", url);
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
      `Irrigation API error ${response.status} at ${url}${body ? `: ${body}` : ""}`,
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
