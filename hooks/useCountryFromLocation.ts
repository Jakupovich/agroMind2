import type { FarmLocation } from "@/hooks/useFarmProfile";

export type CountryCode = "ME" | "BA" | "RS";

/**
 * Lightweight country inference from a farm pin. The three target markets
 * have non-overlapping bounding boxes at the resolution we care about.
 *
 * Bounding boxes are intentionally generous — we would rather label Sarajevo
 * as BA and Subotica as RS than call the reverse geocoding API on every
 * dashboard mount. If a pin falls in the grey zone, we default to ME because
 * Montenegro is our beachhead market.
 */
const BBOX: Record<CountryCode, { latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  ME: { latMin: 41.85, latMax: 43.57, lonMin: 18.40, lonMax: 20.40 },
  BA: { latMin: 42.55, latMax: 45.28, lonMin: 15.70, lonMax: 19.65 },
  RS: { latMin: 42.25, latMax: 46.20, lonMin: 18.80, lonMax: 23.00 },
};

/**
 * Returns the best-guess country code for a pin, or `null` when the pin is
 * outside all three bounding boxes entirely (e.g. the default München pin
 * before the user has actually run through onboarding).
 */
export function countryFromLocation(loc: FarmLocation | null): CountryCode | null {
  if (!loc) return null;
  const { latitude: lat, longitude: lon } = loc;
  // Order matters for overlaps on the CG/BA/RS triple-point near Sandžak.
  if (lat <= 43.57 && lon <= 20.40 && inBox("ME", lat, lon)) return "ME";
  if (inBox("BA", lat, lon)) return "BA";
  if (inBox("RS", lat, lon)) return "RS";
  if (inBox("ME", lat, lon)) return "ME";
  return null;
}

function inBox(code: CountryCode, lat: number, lon: number): boolean {
  const b = BBOX[code];
  return lat >= b.latMin && lat <= b.latMax && lon >= b.lonMin && lon <= b.lonMax;
}
