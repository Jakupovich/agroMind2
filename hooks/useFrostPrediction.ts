import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchPrediction,
  PredictionResponse,
} from "@/services/agroPredictService";

interface State {
  data: PredictionResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

const CACHE_TTL_MS = 60 * 60 * 1000;

function cacheKey(lat: number, lon: number, cropIds: string[], lang: string): string {
  const latR = lat.toFixed(2);
  const lonR = lon.toFixed(2);
  const crops = [...cropIds].sort().join(",");
  return `agro_predict:${latR}:${lonR}:${crops}:${lang}`;
}

async function readCache(key: string): Promise<PredictionResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      at: number;
      data: PredictionResponse;
    };
    if (Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(key: string, data: PredictionResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ at: Date.now(), data }),
    );
  } catch {
    /* ignore cache write errors */
  }
}

/**
 * Fetches a frost-risk prediction from the Agro-Predict AI backend for the given
 * location and list of crops. Mirrors the useIrrigation / useWeather hook shape:
 * `{ data, loading, refreshing, error, refresh }`. Honours AbortController so
 * rapid parameter changes don't pile up stale network calls, and caches the
 * last successful response in AsyncStorage (1h TTL) so the UI can render
 * immediately on reopen while a fresh fetch runs in the background.
 */
export function useFrostPrediction(
  lat: number | null | undefined,
  lon: number | null | undefined,
  cropIds: string[],
  lang: "bs" | "en" = "en",
) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    refreshing: false,
    error: null,
  });
  const [tick, setTick] = useState(0);
  const cropsKey = cropIds.join(",");
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (lat == null || lon == null || cropIds.length === 0) {
      setState({ data: null, loading: false, refreshing: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    let cancelled = false;

    const key = cacheKey(lat, lon, cropIds, lang);

    (async () => {
      const cached = await readCache(key);
      if (cancelled) return;
      if (cached) {
        setState({ data: cached, loading: false, refreshing: true, error: null });
      } else {
        setState({ data: null, loading: true, refreshing: false, error: null });
      }

      try {
        const fresh = await fetchPrediction({
          lat,
          lon,
          cropIds,
          lang,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon, cropsKey, lang, tick]);

  return { ...state, refresh };
}
