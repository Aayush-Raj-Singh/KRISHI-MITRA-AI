export interface CropRecommendationRequest {
  soil_n: number;
  soil_p: number;
  soil_k: number;
  soil_ph: number;
  temperature_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  location: string;
  season?: string | null;
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
  recommendation_id?: string | null;
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
  recommendation_id?: string | null;
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
  forecast?: WeatherDay[] | null;
  location?: string | null;
  days?: number;
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
  recommendation_id?: string | null;
  weather_location?: string | null;
  weather_source?: string | null;
  weather_cached?: boolean | null;
  weather_fetched_at?: string | null;
}
