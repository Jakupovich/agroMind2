/**
 * Open-Meteo Historical Archive client + aggregations.
 *
 * Archive API is free, public and needs no API key. We pull daily values for
 * the last N full calendar years and reduce them to yearly aggregates the UI
 * can chart directly.
 */

const ARCHIVE_BASE_URL = "https://archive-api.open-meteo.com/v1/archive";

export interface DailyArchive {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  temperature_2m_mean: (number | null)[];
  precipitation_sum: (number | null)[];
}

export interface ArchiveResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  daily_units: Record<string, string>;
  daily: DailyArchive;
}

export interface YearlyStats {
  year: number;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  frostDays: number;
  anomaly: number;
}

export interface MonthlyStats {
  month: number;
  avgTemp: number;
  precipitation: number;
  frostDays: number;
}

export interface ClimateHistory {
  yearly: YearlyStats[];
  byMonth: MonthlyStats[];
  baselineAvgTemp: number;
  totalWarmingC: number;
  rangeStart: number;
  rangeEnd: number;
}

async function fetchArchive(
  lat: number,
  lon: number,
  startDate: string,
  endDate: string,
  signal?: AbortSignal,
): Promise<ArchiveResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: startDate,
    end_date: endDate,
    daily:
      "temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum",
    timezone: "auto",
  });
  const url = `${ARCHIVE_BASE_URL}?${params}`;
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Open-Meteo Archive error ${res.status}`);
  }
  return res.json();
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function aggregate(archive: ArchiveResponse): {
  yearly: YearlyStats[];
  byMonth: MonthlyStats[];
} {
  const byYear = new Map<
    number,
    {
      tempMeans: number[];
      tempMaxes: number[];
      tempMins: number[];
      precip: number;
      frost: number;
    }
  >();
  const byMonth = new Map<
    number,
    { tempMeans: number[]; precip: number; frost: number }
  >();

  const { time, temperature_2m_max, temperature_2m_min, temperature_2m_mean, precipitation_sum } =
    archive.daily;

  for (let i = 0; i < time.length; i++) {
    const dateStr = time[i];
    const [yearStr, monthStr] = dateStr.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const tMax = temperature_2m_max[i];
    const tMin = temperature_2m_min[i];
    const tMean = temperature_2m_mean[i];
    const p = precipitation_sum[i] ?? 0;
    if (tMax == null || tMin == null || tMean == null) continue;

    let yEntry = byYear.get(year);
    if (!yEntry) {
      yEntry = {
        tempMeans: [],
        tempMaxes: [],
        tempMins: [],
        precip: 0,
        frost: 0,
      };
      byYear.set(year, yEntry);
    }
    yEntry.tempMeans.push(tMean);
    yEntry.tempMaxes.push(tMax);
    yEntry.tempMins.push(tMin);
    yEntry.precip += p;
    if (tMin <= 0) yEntry.frost += 1;

    let mEntry = byMonth.get(month);
    if (!mEntry) {
      mEntry = { tempMeans: [], precip: 0, frost: 0 };
      byMonth.set(month, mEntry);
    }
    mEntry.tempMeans.push(tMean);
    mEntry.precip += p;
    if (tMin <= 0) mEntry.frost += 1;
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);
  const baseCount = Math.min(5, years.length);
  const baselineYears = years.slice(0, baseCount);
  const baselineAvg =
    baselineYears.length > 0
      ? mean(
          baselineYears.flatMap((y) => byYear.get(y)?.tempMeans ?? []),
        )
      : 0;

  const yearly: YearlyStats[] = years.map((y) => {
    const e = byYear.get(y)!;
    const avg = mean(e.tempMeans);
    return {
      year: y,
      avgTemp: Number(avg.toFixed(2)),
      maxTemp: Number(Math.max(...e.tempMaxes).toFixed(2)),
      minTemp: Number(Math.min(...e.tempMins).toFixed(2)),
      precipitation: Number(e.precip.toFixed(1)),
      frostDays: e.frost,
      anomaly: Number((avg - baselineAvg).toFixed(2)),
    };
  });

  const monthCount = years.length || 1;
  const byMonthArr: MonthlyStats[] = [];
  for (let m = 1; m <= 12; m++) {
    const e = byMonth.get(m);
    if (!e) continue;
    byMonthArr.push({
      month: m,
      avgTemp: Number(mean(e.tempMeans).toFixed(2)),
      precipitation: Number((e.precip / monthCount).toFixed(1)),
      frostDays: Number((e.frost / monthCount).toFixed(1)),
    });
  }

  return { yearly, byMonth: byMonthArr };
}

/**
 * Fetches 20 calendar years of daily archive data for the given coordinates
 * and returns yearly + monthly aggregates ready to chart.
 *
 * `endYear` defaults to last full year so we never hit a half-complete range.
 */
export async function fetchClimateHistory(
  lat: number,
  lon: number,
  opts: { years?: number; endYear?: number; signal?: AbortSignal } = {},
): Promise<ClimateHistory> {
  const years = opts.years ?? 20;
  const endYear = opts.endYear ?? new Date().getUTCFullYear() - 1;
  const startYear = endYear - years + 1;
  const archive = await fetchArchive(
    lat,
    lon,
    `${startYear}-01-01`,
    `${endYear}-12-31`,
    opts.signal,
  );
  const { yearly, byMonth } = aggregate(archive);
  const baseline = yearly
    .slice(0, Math.min(5, yearly.length))
    .map((y) => y.avgTemp);
  const last = yearly
    .slice(-Math.min(5, yearly.length))
    .map((y) => y.avgTemp);
  const baselineAvgTemp = mean(baseline);
  const recentAvg = mean(last);
  return {
    yearly,
    byMonth,
    baselineAvgTemp: Number(baselineAvgTemp.toFixed(2)),
    totalWarmingC: Number((recentAvg - baselineAvgTemp).toFixed(2)),
    rangeStart: startYear,
    rangeEnd: endYear,
  };
}
