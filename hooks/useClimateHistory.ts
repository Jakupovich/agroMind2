import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ClimateHistory,
  fetchClimateHistory,
} from "@/services/historyService";

interface State {
  data: ClimateHistory | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function cacheKey(lat: number, lon: number, years: number): string {
  return `climate_history:${lat.toFixed(2)}:${lon.toFixed(2)}:${years}y`;
}

async function readCache(key: string): Promise<ClimateHistory | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: ClimateHistory };
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(key: string, data: ClimateHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore */
  }
}

/**
 * Fetches 20 years of historical Open-Meteo archive data for a coordinate and
 * surfaces it as yearly + monthly aggregates. The Archive API is slow (the
 * first call can be several seconds) so we cache per-coordinate in
 * AsyncStorage for 24 hours — the historical record doesn't change between
 * app opens.
 */
export function useClimateHistory(
  lat: number | null | undefined,
  lon: number | null | undefined,
  years = 20,
) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    refreshing: false,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (lat == null || lon == null) {
      setState({ data: null, loading: false, refreshing: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    let cancelled = false;

    const key = cacheKey(lat, lon, years);

    (async () => {
      const cached = await readCache(key);
      if (cancelled) return;
      if (cached) {
        setState({ data: cached, loading: false, refreshing: true, error: null });
      } else {
        setState({ data: null, loading: true, refreshing: false, error: null });
      }

      try {
        const fresh = await fetchClimateHistory(lat, lon, {
          years,
          signal: ac.signal,
        });
        if (cancelled) return;
        await writeCache(key, fresh);
        setState({ data: fresh, loading: false, refreshing: false, error: null });
      } catch (err: unknown) {
        if (cancelled || ac.signal.aborted) return;
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : String(err);
        setState((prev) => ({
          data: prev.data,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [lat, lon, years, tick]);

  return { ...state, refresh };
}
