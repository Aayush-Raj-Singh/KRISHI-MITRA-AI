import { getCachedWithMeta, setCached } from "./cache";

type GeoPlace = {
  city?: string;
  state?: string;
  country?: string;
  label?: string;
  coords: { lat: number; lon: number };
};

const GEO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const fetchJson = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Location lookup failed.");
  }
  return response.json() as Promise<Record<string, unknown>>;
};

const isFresh = (ts?: number) => (typeof ts === "number" ? Date.now() - ts < GEO_CACHE_TTL_MS : false);

const buildLabel = (city?: string, state?: string, country?: string) => {
  return [city, state, country].filter(Boolean).join(", ");
};

export const reverseGeocode = async (lat: number, lon: number): Promise<Omit<GeoPlace, "coords">> => {
  const key = `geo_reverse:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  const cached = getCachedWithMeta<Omit<GeoPlace, "coords">>(key);
  if (cached && isFresh(cached.ts)) {
    return cached.value;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  const result = Array.isArray(data?.results) ? data.results[0] : undefined;
  if (!result) {
    throw new Error("No location match found.");
  }
  const city = String(result.name || result.city || result.admin2 || "");
  const state = String(result.admin1 || "");
  const country = String(result.country || "");
  const payload = {
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
    label: buildLabel(city, state, country)
  };
  setCached(key, payload);
  return payload;
};

export const geocodeLocation = async (query: string): Promise<GeoPlace> => {
  const safeQuery = query.trim();
  if (!safeQuery) {
    throw new Error("Please enter a location.");
  }
  const key = `geo_search:${safeQuery.toLowerCase()}`;
  const cached = getCachedWithMeta<GeoPlace>(key);
  if (cached && isFresh(cached.ts)) {
    return cached.value;
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    safeQuery
  )}&count=1&language=en&format=json`;
  const data = await fetchJson(url);
  const result = Array.isArray(data?.results) ? data.results[0] : undefined;
  if (!result) {
    throw new Error("No location match found.");
  }
  const city = String(result.name || "");
  const state = String(result.admin1 || "");
  const country = String(result.country || "");
  const payload: GeoPlace = {
    city: city || undefined,
    state: state || undefined,
    country: country || undefined,
    label: buildLabel(city, state, country),
    coords: {
      lat: Number(result.latitude),
      lon: Number(result.longitude)
    }
  };
  setCached(key, payload);
  return payload;
};

