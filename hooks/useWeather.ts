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
      let coords = DEFAULT_LOCATION;
      let locName = "Bavaria, DE";

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          
        };
        const locationData = JSON.stringify({ coords, locName });
        await AsyncStorage.setItem("user_location", locationData);

        const geocode = await Location.reverseGeocodeAsync(coords);
        if (geocode.length > 0) {
          const g = geocode[0];
          const parts = [g.city ?? g.region, g.country].filter(Boolean);
          locName = parts.join(", ");
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
    } catch (err: any) {
      try {
        const data = await fetchWeather(
          DEFAULT_LOCATION.latitude,
          DEFAULT_LOCATION.longitude
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
