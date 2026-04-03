import { getCachedWithMeta, setCached } from "./cache";
import { getOfflineRecord, isOnline, saveOfflineRecord } from "../utils/offlineStorage";

const TEN_MINUTES_MS = 1000 * 60 * 10;

const WEATHER_LABELS = {
  0: "Clear",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
};

const isFresh = (ts) => typeof ts === "number" && Date.now() - ts < TEN_MINUTES_MS;

const cacheKey = (prefix, lat, lon) => `${prefix}:${lat.toFixed(3)}:${lon.toFixed(3)}`;

const fetchWithCache = async (key, fetcher, offlineStoreKey) => {
  const cached = getCachedWithMeta(key);
  if (cached && isFresh(cached.ts)) {
    return {
      ...cached.value,
      cached: true,
      offline: false,
      lastUpdated: new Date(cached.ts).toISOString(),
    };
  }
  if (!isOnline()) {
    const offline = await getOfflineRecord("weather", offlineStoreKey);
    if (offline) {
      return {
        ...offline.value,
        cached: true,
        offline: true,
        stale: true,
        lastUpdated: offline.updatedAt,
      };
    }
  }
  try {
    const data = await fetcher();
    setCached(key, data);
    await saveOfflineRecord("weather", offlineStoreKey, data);
    return { ...data, offline: false, lastUpdated: new Date().toISOString() };
  } catch (error) {
    if (cached) {
      return {
        ...cached.value,
        cached: true,
        stale: true,
        offline: false,
        lastUpdated: new Date(cached.ts).toISOString(),
      };
    }
    const offline = await getOfflineRecord("weather", offlineStoreKey);
    if (offline) {
      return {
        ...offline.value,
        cached: true,
        stale: true,
        offline: true,
        lastUpdated: offline.updatedAt,
      };
    }
    throw error;
  }
};

export const getCurrentWeather = async (lat, lon) => {
  const key = cacheKey("weather_current", lat, lon);
  const offlineKey = cacheKey("weather_current", lat, lon);
  return fetchWithCache(
    key,
    async () => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to fetch weather.");
      }
      const payload = await response.json();
      const current = payload?.current || {};
      const code = Number(current.weather_code);
      return {
        temperatureC: Number(current.temperature_2m),
        humidity: Number(current.relative_humidity_2m),
        windSpeedKph: Number(current.wind_speed_10m),
        weatherCode: Number.isNaN(code) ? 0 : code,
        condition: WEATHER_LABELS[code] || "Clear",
        observedAt: current.time || new Date().toISOString(),
        source: "open-meteo",
      };
    },
    offlineKey,
  );
};

export const getAQI = async (lat, lon) => {
  const key = cacheKey("weather_aqi", lat, lon);
  const offlineKey = cacheKey("weather_aqi", lat, lon);
  return fetchWithCache(
    key,
    async () => {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,carbon_monoxide,ozone,nitrogen_dioxide,sulphur_dioxide&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Unable to fetch air quality.");
      }
      const payload = await response.json();
      const current = payload?.current || {};
      return {
        aqi: Number(current.us_aqi),
        pm10: Number(current.pm10),
        pm2_5: Number(current.pm2_5),
        o3: Number(current.ozone),
        co: Number(current.carbon_monoxide),
        no2: Number(current.nitrogen_dioxide),
        so2: Number(current.sulphur_dioxide),
        observedAt: current.time || new Date().toISOString(),
        source: "open-meteo",
      };
    },
    offlineKey,
  );
};
