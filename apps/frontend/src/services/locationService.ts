import { getCachedWithMeta, setCached } from "./cache";
import { resolveApiBaseUrl } from "./runtimeConfig";

type GeoPlace = {
  city?: string;
  state?: string;
  country?: string;
  label?: string;
  coords: { lat: number; lon: number };
};

type BackendLocationLookup = {
  city?: string;
  state?: string;
  country?: string;
  label: string;
  latitude: number;
  longitude: number;
};

const GEO_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);

const formatCoordinate = (value: number) => (Number.isFinite(value) ? value.toFixed(5) : "--");

export const formatCoordinateLabel = (lat: number, lon: number) =>
  `Lat ${formatCoordinate(lat)}, Lon ${formatCoordinate(lon)}`;

const fetchJson = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Location lookup failed.");
  }
  return response.json() as Promise<Record<string, unknown>>;
};

const fetchBackendData = async <T>(path: string) => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error("Location lookup failed.");
  }
  const payload = (await response.json()) as { success?: boolean; data?: T; message?: string };
  if (!payload.success || !payload.data) {
    throw new Error(payload.message || "Location lookup failed.");
  }
  return payload.data;
};

const isFresh = (ts?: number) =>
  typeof ts === "number" ? Date.now() - ts < GEO_CACHE_TTL_MS : false;

const buildLabel = (city?: string, state?: string, country?: string) => {
  return [city, state, country].filter(Boolean).join(", ");
};

const createPlacePayload = (
  city?: string,
  state?: string,
  country?: string,
  fallbackLabel?: string,
): Omit<GeoPlace, "coords"> => ({
  city: city || undefined,
  state: state || undefined,
  country: country || undefined,
  label: buildLabel(city, state, country) || fallbackLabel,
});

const parseOpenMeteoReverse = (data: Record<string, unknown>) => {
  const result = Array.isArray(data?.results) ? data.results[0] : undefined;
  if (!result) {
    return null;
  }
  const city = String(result.name || result.city || result.admin2 || "");
  const state = String(result.admin1 || "");
  const country = String(result.country || "");
  return createPlacePayload(city, state, country);
};

const parseBigDataCloudReverse = (data: Record<string, unknown>) => {
  const localityInfo = data.localityInfo as
    | { administrative?: Array<{ name?: string }> }
    | undefined;
  const city = String(data.city || data.locality || localityInfo?.administrative?.[2]?.name || "");
  const state = String(data.principalSubdivision || "");
  const country = String(data.countryName || "");
  if (!city && !state && !country) {
    return null;
  }
  return createPlacePayload(city, state, country);
};

export const reverseGeocode = async (
  lat: number,
  lon: number,
): Promise<Omit<GeoPlace, "coords">> => {
  const key = `geo_reverse:${lat.toFixed(5)}:${lon.toFixed(5)}`;
  const cached = getCachedWithMeta<Omit<GeoPlace, "coords">>(key);
  if (cached && isFresh(cached.ts)) {
    return cached.value;
  }

  try {
    const payload = await fetchBackendData<BackendLocationLookup>(
      `/data/location/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
    );
    if (payload?.label) {
      const normalized = {
        city: payload.city,
        state: payload.state,
        country: payload.country,
        label: payload.label,
      };
      setCached(key, normalized);
      return normalized;
    }
  } catch {
    // Fall through to direct providers for extra resilience.
  }

  const providers = [
    {
      url: `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`,
      parser: parseOpenMeteoReverse,
    },
    {
      url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      parser: parseBigDataCloudReverse,
    },
  ];

  for (const provider of providers) {
    try {
      const data = await fetchJson(provider.url);
      const payload = provider.parser(data);
      if (payload) {
        setCached(key, payload);
        return payload;
      }
    } catch {
      // Try the next provider before falling back to coordinates.
    }
  }

  const payload = createPlacePayload(
    undefined,
    undefined,
    undefined,
    formatCoordinateLabel(lat, lon),
  );
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

  try {
    const payload = await fetchBackendData<BackendLocationLookup>(
      `/data/location/search?query=${encodeURIComponent(safeQuery)}`,
    );
    if (payload?.label) {
      const normalized: GeoPlace = {
        city: payload.city,
        state: payload.state,
        country: payload.country,
        label: payload.label,
        coords: {
          lat: payload.latitude,
          lon: payload.longitude,
        },
      };
      setCached(key, normalized);
      return normalized;
    }
  } catch {
    // Fall back to direct browser geocoding if backend lookup is unavailable.
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    safeQuery,
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
      lon: Number(result.longitude),
    },
  };
  setCached(key, payload);
  return payload;
};
