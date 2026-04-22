import { NdviResponse, fetchNdvi } from "@/services/ndviService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

interface NdviState {
  data: NdviResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(lat: number, lon: number, box: number): string {
  return `ndvi:${lat.toFixed(3)}:${lon.toFixed(3)}:${box}`;
}

interface CacheEntry {
  at: number;
  data: NdviResponse;
}

/**
 * Fetches satellite NDVI for the farm pin, with a 1h AsyncStorage cache and
 * abort-on-unmount/change behaviour.
 */
export function useNdvi(
  lat: number | null | undefined,
  lon: number | null | undefined,
  boxMeters: number = 500,
) {
  const [state, setState] = useState<NdviState>({
    data: null,
    loading: false,
    refreshing: false,
    error: null,
  });
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (lat == null || lon == null) {
        setState({ data: null, loading: false, refreshing: false, error: null });
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const key = cacheKey(lat, lon, boxMeters);

      let hadCache = false;
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry;
          if (parsed?.data) {
            hadCache = true;
            const fresh = Date.now() - parsed.at < CACHE_TTL_MS;
            setState((prev) => ({
              ...prev,
              data: parsed.data,
              loading: false,
              refreshing: !fresh || isRefresh,
              error: null,
            }));
            if (fresh && !isRefresh) return;
          }
        }
      } catch {
        // ignore cache read errors
      }

      if (!hadCache) {
        setState((prev) => ({
          ...prev,
          loading: true,
          refreshing: false,
          error: null,
        }));
      }

      try {
        const data = await fetchNdvi(lat, lon, {
          boxMeters,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setState({ data, loading: false, refreshing: false, error: null });
        try {
          const entry: CacheEntry = { at: Date.now(), data };
          await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch {
          // ignore cache write errors
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch NDVI";
        setState((prev) => ({
          data: prev.data,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
    },
    [lat, lon, boxMeters],
  );

  useEffect(() => {
    load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { ...state, refresh };
}
