import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface FarmLocation {
  latitude: number;
  longitude: number;
}

export interface FarmProfile {
  location: FarmLocation | null;
  crops: string[];
  /** Parsed farm size in hectares. 0 when onboarding did not capture a size. */
  sizeHa: number;
  loading: boolean;
  /** Re-read the profile from AsyncStorage (e.g. after the user edits it). */
  refresh: () => void;
}

const FARM_LOCATION_KEY = "farm_location";
const FARM_CROPS_KEY = "farm_crops";
const FARM_SIZE_KEY = "farm_size";

/**
 * Onboarding stores the farm size as a human label ("<1 ha", "1–5 ha", ...).
 * Extract the first number so downstream cards can do € / ha math. If nothing
 * parseable is found, fall back to 2 ha — the regional typical field size.
 */
function parseSizeHa(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.replace(/,/g, ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseLocation(raw: string | null): FarmLocation | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as { latitude?: unknown }).latitude === "number" &&
      typeof (parsed as { longitude?: unknown }).longitude === "number"
    ) {
      const { latitude, longitude } = parsed as FarmLocation;
      return { latitude, longitude };
    }
  } catch {
    /* fall through */
  }
  return null;
}

function parseCrops(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((c): c is string => typeof c === "string");
    }
  } catch {
    /* fall through */
  }
  return [];
}

/**
 * Reads the farm profile (location + crops) that the user configured in
 * the onboarding screen and persisted to AsyncStorage. Returns `location: null`
 * until onboarding has been completed, letting callers fall back to another
 * source (e.g. GPS) in the meantime.
 */
export function useFarmProfile(): FarmProfile {
  const [state, setState] = useState<Omit<FarmProfile, "refresh">>({
    location: null,
    crops: [],
    sizeHa: 0,
    loading: true,
  });

  const load = useCallback(async () => {
    try {
      const [[, locRaw], [, cropsRaw], [, sizeRaw]] = await AsyncStorage.multiGet([
        FARM_LOCATION_KEY,
        FARM_CROPS_KEY,
        FARM_SIZE_KEY,
      ]);
      setState({
        location: parseLocation(locRaw),
        crops: parseCrops(cropsRaw),
        sizeHa: parseSizeHa(sizeRaw),
        loading: false,
      });
    } catch {
      setState({ location: null, crops: [], sizeHa: 0, loading: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
