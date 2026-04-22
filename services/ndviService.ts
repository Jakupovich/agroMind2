/**
 * AgroMind backend API client — Satellite NDVI (Sentinel Hub / CDSE).
 *
 * Shares the same base-URL resolution chain as `irrigationService`.
 */
import { getApiBaseUrl } from "@/services/irrigationService";

export type NdviLight = "green" | "amber" | "red";

export interface NdviStats {
  mean: number;
  min: number;
  max: number;
  stdev: number;
  valid_pixel_ratio: number;
}

export interface NdviResponse {
  latitude: number;
  longitude: number;
  box_meters: number;
  acquisition_date: string | null;
  cloud_coverage: number | null;
  stats: NdviStats;
  traffic_light: NdviLight;
  score_label: string;
  explanation: string[];
  image_png_base64: string;
}

export async function fetchNdvi(
  lat: number,
  lon: number,
  opts: { boxMeters?: number; lookbackDays?: number; signal?: AbortSignal } = {},
): Promise<NdviResponse> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    box_meters: (opts.boxMeters ?? 500).toString(),
    lookback_days: (opts.lookbackDays ?? 30).toString(),
  });
  const url = `${baseUrl}/ndvi?${params}`;

  if (__DEV__) {
    console.log("[ndvi] GET", url);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      signal: opts.signal,
      headers: { Accept: "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Network request failed for ${url}: ${message}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `NDVI API error ${response.status} at ${url}${body ? `: ${body}` : ""}`,
    );
  }

  return (await response.json()) as NdviResponse;
}

export function ndviColorKey(light: NdviLight): NdviLight {
  return light;
}
