import { cachedPost } from "./api";

export interface CropRecommendationRequest {
  soil_n: number;
  soil_p: number;
  soil_k: number;
  soil_ph: number;
  temperature_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  location: string;
  season?: string;
  historical_yield?: number | null;
}

export interface CropRecommendationItem {
  crop: string;
  confidence: number;
  explanation: string;
}

export interface CropRecommendationResponse {
  recommendations: CropRecommendationItem[];
  model_version: string;
  created_at: string;
  cached: boolean;
  recommendation_id?: string;
}

export interface PriceForecastRequest {
  crop: string;
  market: string;
  currency: string;
}

export interface PriceForecastSeries {
  horizon_days: number;
  dates: string[];
  forecast: number[];
  lower: number[];
  upper: number[];
}

export interface PriceHistoricalSeries {
  dates: string[];
  prices: number[];
}

export interface PriceForecastResponse {
  crop: string;
  market: string;
  currency: string;
  series: PriceForecastSeries[];
  historical?: PriceHistoricalSeries | null;
  mape: number;
  confidence_interval: {
    level: number;
    description: string;
  };
  model_version: string;
  created_at: string;
  cached: boolean;
  recommendation_id?: string;
}

export interface WeatherDay {
  date: string;
  rainfall_mm: number;
  temperature_c: number;
}

export interface WaterOptimizationRequest {
  crop: string;
  growth_stage: string;
  soil_moisture_pct: number;
  water_source: string;
  field_area_acres: number;
  forecast: WeatherDay[];
}

export interface IrrigationScheduleItem {
  date: string;
  irrigation_mm: number;
  irrigation_liters: number;
  reason: string;
}

export interface WaterOptimizationResponse {
  crop: string;
  schedule: IrrigationScheduleItem[];
  total_volume_liters: number;
  water_savings_percent: number;
  notes: string[];
  model_version: string;
  created_at: string;
  cached: boolean;
  recommendation_id?: string;
}

export const fetchCropRecommendation = async (
  payload: CropRecommendationRequest
): Promise<CropRecommendationResponse> => {
  const key = `crop:${JSON.stringify(payload)}`;
  return cachedPost<CropRecommendationResponse, CropRecommendationRequest>(
    key,
    "/recommendations/crop",
    payload
  );
};

export const fetchPriceForecast = async (
  payload: PriceForecastRequest
): Promise<PriceForecastResponse> => {
  const key = `price:${JSON.stringify(payload)}`;
  return cachedPost<PriceForecastResponse, PriceForecastRequest>(
    key,
    "/recommendations/price-forecast",
    payload
  );
};

export const fetchWaterOptimization = async (
  payload: WaterOptimizationRequest
): Promise<WaterOptimizationResponse> => {
  const key = `water:${JSON.stringify(payload)}`;
  return cachedPost<WaterOptimizationResponse, WaterOptimizationRequest>(
    key,
    "/recommendations/water-optimization",
    payload
  );
};
