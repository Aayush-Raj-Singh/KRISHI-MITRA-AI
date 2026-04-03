import api, { ApiResponse, unwrap } from "./api";
import { cachedGet } from "./apiClient";
import { getCachedWithMeta, setCached } from "./cache";

export interface WeatherDay {
  date: string;
  rainfall_mm: number;
  temperature_c: number;
}

export interface WeatherResponse {
  location: string;
  source: string;
  forecast: WeatherDay[];
  fetched_at: string;
  cached: boolean;
  offline?: boolean;
  last_updated?: string;
  stale_data_warning?: string | null;
}

export interface MandiPricePoint {
  date: string;
  price: number;
}

export interface MandiCropCatalogItem {
  crop: string;
  category: string;
}

export interface MandiCatalogResponse {
  crops: MandiCropCatalogItem[];
  markets: string[];
}

export interface MandiPriceResponse {
  crop: string;
  market: string;
  source: string;
  prices: MandiPricePoint[];
  fetched_at: string;
  cached: boolean;
  offline?: boolean;
  last_updated?: string;
  stale_data_warning?: string | null;
}

export const fetchWeather = async (params: {
  location: string;
  days: number;
}): Promise<WeatherResponse> => {
  const cacheKey = `weather:${params.location.toLowerCase()}:${params.days}`;
  const result = await cachedGet<WeatherResponse>(
    "/integrations/weather",
    { params },
    { store: "weather", key: cacheKey },
  );
  const offline = result.meta.offline || result.meta.stale;
  return {
    ...result.data,
    cached: result.meta.cached,
    offline,
    last_updated: result.meta.updatedAt || result.data.fetched_at,
    stale_data_warning: offline
      ? result.data.stale_data_warning || "Offline mode — showing last saved data."
      : result.data.stale_data_warning,
  };
};

export const fetchMandiPrices = async (params: {
  crop: string;
  market: string;
  days: number;
}): Promise<MandiPriceResponse> => {
  const cacheKey = `mandi_prices:${params.crop.toLowerCase()}:${params.market.toLowerCase()}:${params.days}`;
  const cached = getCachedWithMeta<MandiPriceResponse>(cacheKey);
  const canReuseCachedMandi =
    cached &&
    Date.now() - cached.ts < 1000 * 60 * 10 &&
    cached.value.source !== "stub" &&
    !cached.value.stale_data_warning;
  if (canReuseCachedMandi) {
    return { ...cached.value, cached: true };
  }
  const result = await cachedGet<MandiPriceResponse>(
    "/integrations/mandi-prices",
    { params },
    { store: "mandi", key: cacheKey },
  );
  const offline = result.meta.offline || result.meta.stale;
  if (!offline) {
    setCached(cacheKey, result.data);
  }
  return {
    ...result.data,
    cached: result.meta.cached || Boolean(cached),
    offline,
    last_updated: result.meta.updatedAt || result.data.fetched_at,
    stale_data_warning: offline
      ? result.data.stale_data_warning || "Offline mode — using saved mandi prices."
      : result.data.stale_data_warning,
  };
};

export const fetchMandiCatalog = async (params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<MandiCatalogResponse> => {
  const response = await api.get<ApiResponse<MandiCatalogResponse>>("/integrations/mandi-catalog", {
    params,
  });
  return unwrap(response.data);
};
