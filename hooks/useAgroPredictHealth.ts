import {
  fetchHealth,
  type HealthResponse,
} from "@/services/agroPredictService";
import { useEffect, useState } from "react";

/**
 * Pulls `/health` from the Agro-Predict backend so the AI Models card can
 * render the **live** model AUC instead of a hard-coded number. Silently
 * returns `null` if the backend is unreachable — the card falls back to the
 * last-known published AUC shipped with the app.
 */
export function useAgroPredictHealth() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const h = await fetchHealth(controller.signal);
        setData(h);
      } catch {
        // Silent — the card handles `null` with the published fallback.
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  return { data, loading };
}
