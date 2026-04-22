import {
  DEFAULT_LOCATION,
  fetchWeather,
  WeatherData,
} from "@/services/weatherService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  locationName: string;
}

interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Reads the pinned farm location saved during onboarding (same key written in
 * app/onboarding.tsx). Returns null if onboarding was skipped / not completed.
 */
async function readFarmLocation(): Promise<Coords | null> {
  try {
    const raw = await AsyncStorage.getItem("farm_location");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Coords>;
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveLocationName(
  coords: Coords,
  fallback: string,
): Promise<string> {
  try {
    const geocode = await Location.reverseGeocodeAsync(coords);
    if (geocode.length > 0) {
      const g = geocode[0];
      const parts = [g.city ?? g.region, g.country].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
  } catch {
    /* ignore geocode errors and fall through */
  }
  return fallback;
}

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: true,
    refreshing: false,
    error: null,
    locationName: "Bavaria, DE",
  });

  const load = useCallback(async (isRefresh = false) => {
    setState((prev) => ({
      ...prev,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: null,
    }));

    try {
      // Preferred source: the pin the farmer placed during onboarding. This
      // keeps Live Weather, Field Stats, Climate Score, Smart Irrigation and
      // Frost Prediction all aligned on one canonical location.
      const farm = await readFarmLocation();

      let coords: Coords;
      let locName: string;

      if (farm) {
        coords = farm;
        locName = await resolveLocationName(
          coords,
          `${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`,
        );
      } else {
        // Fallback: device GPS (only when onboarding hasn't been completed).
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          locName = await resolveLocationName(coords, "Your location");
          await AsyncStorage.setItem(
            "user_location",
            JSON.stringify({ coords, locName }),
          );
        } else {
          coords = DEFAULT_LOCATION;
          locName = "Bavaria, DE";
        }
      }

      const data = await fetchWeather(coords.latitude, coords.longitude);
      setState({
        data,
        loading: false,
        refreshing: false,
        error: null,
        locationName: locName,
      });
    } catch {
      try {
        const data = await fetchWeather(
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude,
        );
        setState({
          data,
          loading: false,
          refreshing: false,
          error: null,
          locationName: "Bavaria, DE (default)",
        });
      } catch {
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: "Unable to fetch weather data",
        }));
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { ...state, refresh };
}
