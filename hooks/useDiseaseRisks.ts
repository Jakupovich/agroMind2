import {
  DiseaseResponse,
  fetchDiseaseRisk,
} from "@/services/diseaseService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

interface DiseaseRisksState {
  data: DiseaseResponse[] | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function cacheKey(lat: number, lon: number, crops: string[]): string {
  return `disease_risks:${lat.toFixed(2)}:${lon.toFixed(2)}:${crops
    .map((c) => c.toLowerCase())
    .sort()
    .join(",")}`;
}

interface CacheEntry {
  at: number;
  data: DiseaseResponse[];
}

/**
 * Fetches disease & pest risk in parallel for a list of crops on a single
 * farm coordinate. Mirrors the abort+cache pattern of `useFrostPrediction`.
 */
export function useDiseaseRisks(
  lat: number | null | undefined,
  lon: number | null | undefined,
  crops: string[] | null | undefined,
) {
  const [state, setState] = useState<DiseaseRisksState>({
    data: null,
    loading: false,
    refreshing: false,
    error: null,
  });
  const controllerRef = useRef<AbortController | null>(null);
  const cropsKey = (crops ?? []).map((c) => c.toLowerCase()).sort().join(",");

  const load = useCallback(
    async (isRefresh = false) => {
      if (
        lat == null ||
        lon == null ||
        !crops ||
        crops.length === 0
      ) {
        setState({ data: null, loading: false, refreshing: false, error: null });
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const key = cacheKey(lat, lon, crops);

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
            if (fresh && !isRefresh) {
              return;
            }
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
        const results = await Promise.all(
          crops.map((crop) => fetchDiseaseRisk(lat, lon, crop, controller.signal)),
        );
        if (controller.signal.aborted) return;
        setState({
          data: results,
          loading: false,
          refreshing: false,
          error: null,
        });
        try {
          const entry: CacheEntry = { at: Date.now(), data: results };
          await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch {
          // ignore cache write errors
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Unable to fetch disease risk";
        setState((prev) => ({
          data: prev.data,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
    },
    // cropsKey collapses the array into a stable primitive so the effect
    // only re-runs when the *set* of crops actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lat, lon, cropsKey],
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
