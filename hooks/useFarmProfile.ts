import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export interface FarmLocation {
  latitude: number;
  longitude: number;
}

export interface FarmProfile {
  location: FarmLocation | null;
  crops: string[];
  loading: boolean;
  /** Re-read the profile from AsyncStorage (e.g. after the user edits it). */
  refresh: () => void;
}

const FARM_LOCATION_KEY = "farm_location";
const FARM_CROPS_KEY = "farm_crops";

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
    loading: true,
  });

  const load = useCallback(async () => {
    try {
      const [[, locRaw], [, cropsRaw]] = await AsyncStorage.multiGet([
        FARM_LOCATION_KEY,
        FARM_CROPS_KEY,
      ]);
      setState({
        location: parseLocation(locRaw),
        crops: parseCrops(cropsRaw),
        loading: false,
      });
    } catch {
      setState({ location: null, crops: [], loading: false });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}
