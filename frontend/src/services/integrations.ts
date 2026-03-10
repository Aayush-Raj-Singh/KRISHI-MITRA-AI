import api, { ApiResponse, unwrap } from "./api";

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
  stale_data_warning?: string | null;
}

export const fetchWeather = async (params: { location: string; days: number }): Promise<WeatherResponse> => {
  const response = await api.get<ApiResponse<WeatherResponse>>("/integrations/weather", { params });
  return unwrap(response.data);
};

export const fetchMandiPrices = async (params: {
  crop: string;
  market: string;
  days: number;
}): Promise<MandiPriceResponse> => {
  const response = await api.get<ApiResponse<MandiPriceResponse>>("/integrations/mandi-prices", { params });
  return unwrap(response.data);
};

export const fetchMandiCatalog = async (params?: {
  category?: string;
  search?: string;
  limit?: number;
}): Promise<MandiCatalogResponse> => {
  const response = await api.get<ApiResponse<MandiCatalogResponse>>("/integrations/mandi-catalog", { params });
  return unwrap(response.data);
};
