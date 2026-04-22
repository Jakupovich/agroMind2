import {
  fetchIrrigation,
  IrrigationResponse,
} from "@/services/irrigationService";
import { useCallback, useEffect, useState } from "react";

interface IrrigationState {
  data: IrrigationResponse | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

export function useIrrigation(
  lat: number | null | undefined,
  lon: number | null | undefined,
  crop: string,
) {
  const [state, setState] = useState<IrrigationState>({
    data: null,
    loading: false,
    refreshing: false,
    error: null,
  });

  const load = useCallback(
    async (isRefresh = false) => {
      if (lat == null || lon == null || !crop) {
        return;
      }
      setState((prev) => ({
        ...prev,
        loading: !isRefresh && prev.data == null,
        refreshing: isRefresh,
        error: null,
      }));

      try {
        const data = await fetchIrrigation(lat, lon, crop);
        setState({ data, loading: false, refreshing: false, error: null });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unable to fetch irrigation data";
        setState((prev) => ({
          ...prev,
          loading: false,
          refreshing: false,
          error: message,
        }));
      }
    },
    [lat, lon, crop],
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { ...state, refresh };
}
