const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  soilTemperature: number;
  weatherCode: number;
  uvIndex: number;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  precipitation: number;
  weatherCode: number;
}

export interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast[];
  latitude: number;
  longitude: number;
  fetchedAt: number;
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Clear Sky',
  1: 'Mainly Clear',
  2: 'Partly Cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Icy Fog',
  51: 'Light Drizzle',
  53: 'Moderate Drizzle',
  55: 'Dense Drizzle',
  61: 'Light Rain',
  63: 'Moderate Rain',
  65: 'Heavy Rain',
  71: 'Light Snow',
  73: 'Moderate Snow',
  75: 'Heavy Snow',
  80: 'Light Showers',
  81: 'Moderate Showers',
  82: 'Violent Showers',
  85: 'Snow Showers',
  95: 'Thunderstorm',
  96: 'Hail Thunderstorm',
  99: 'Heavy Hail Storm',
};

export function getWeatherDescription(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Unknown';
}

export function isHailRisk(code: number): boolean {
  return code === 96 || code === 99;
}

export function isStormRisk(code: number): boolean {
  return code >= 95;
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'wind_speed_10m',
      'soil_temperature_0cm',
      'weather_code',
      'uv_index',
    ].join(','),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'weather_code',
    ].join(','),
    forecast_days: '7',
    timezone: 'auto',
  });

  const response = await fetch(`${BASE_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }

  const data = await response.json();
  const c = data.current;
  const d = data.daily;

  const daily: DailyForecast[] = (d.time as string[]).map((date: string, i: number) => ({
    date,
    maxTemp: Math.round(d.temperature_2m_max[i] * 10) / 10,
    minTemp: Math.round(d.temperature_2m_min[i] * 10) / 10,
    precipitation: Math.round(d.precipitation_sum[i] * 10) / 10,
    weatherCode: d.weather_code[i],
  }));

  return {
    current: {
      temperature: Math.round(c.temperature_2m * 10) / 10,
      humidity: Math.round(c.relative_humidity_2m),
      precipitation: Math.round(c.precipitation * 10) / 10,
      windSpeed: Math.round(c.wind_speed_10m * 10) / 10,
      soilTemperature: Math.round((c.soil_temperature_0cm ?? 0) * 10) / 10,
      weatherCode: c.weather_code,
      uvIndex: Math.round((c.uv_index ?? 0) * 10) / 10,
    },
    daily,
    latitude,
    longitude,
    fetchedAt: Date.now(),
  };
}

export const DEFAULT_LOCATION = { latitude: 48.1351, longitude: 11.582 };