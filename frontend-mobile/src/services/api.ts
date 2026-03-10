import axios from "axios";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface TokenPayload {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AdvisoryPayload {
  message: string;
  language?: string;
}

export interface AdvisoryResponse {
  reply: string;
  language: string;
  model: string;
  sources: Array<{ title: string; reference: string }>;
  is_fallback: boolean;
  conversation_id: string;
  created_at: string;
}

export interface CropRecommendationPayload {
  soil_n: number;
  soil_p: number;
  soil_k: number;
  soil_ph: number;
  temperature_c: number;
  humidity_pct: number;
  rainfall_mm: number;
  location: string;
  season: string;
  historical_yield?: number;
}

export interface CropRecommendationResponse {
  recommendations: Array<{ crop: string; confidence: number; explanation: string }>;
  model_version: string;
  recommendation_id?: string;
  created_at: string;
}

export interface PriceForecastPayload {
  crop: string;
  market: string;
  currency: string;
}

export interface PriceForecastResponse {
  crop: string;
  market: string;
  currency: string;
  mape: number;
  model_version: string;
  recommendation_id?: string;
  created_at: string;
}

export interface WaterForecastDay {
  date: string;
  rainfall_mm: number;
  temperature_c: number;
}

export interface WaterOptimizationPayload {
  crop: string;
  growth_stage: string;
  soil_moisture_pct: number;
  water_source: string;
  field_area_acres: number;
  forecast: WaterForecastDay[];
}

export interface WaterOptimizationResponse {
  crop: string;
  water_savings_percent: number;
  total_volume_liters: number;
  notes: string[];
  recommendation_id?: string;
  created_at: string;
}

export interface OutcomeFeedbackPayload {
  recommendation_id: string;
  rating: number;
  yield_kg_per_acre: number;
  income_inr: number;
  water_usage_l_per_acre: number;
  fertilizer_kg_per_acre: number;
  notes?: string;
}

export interface OutcomeFeedbackResponse {
  feedback_id: string;
  sustainability_score: number;
  recognition_badge?: string | null;
  trend?: string | null;
  created_at: string;
}

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export const login = async (payload: LoginPayload): Promise<TokenPayload> => {
  const response = await client.post<ApiResponse<TokenPayload>>("/auth/login", payload);
  if (!response.data.success) {
    throw new Error(response.data.message || "Login failed");
  }
  return response.data.data;
};

export const fetchDashboardOverview = async (accessToken: string): Promise<{ status: string }> => {
  const response = await client.get<ApiResponse<{ status: string }>>("/ws/health", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.data.success) {
    throw new Error(response.data.message || "Dashboard data failed");
  }
  return response.data.data;
};

export const sendAdvisoryChat = async (
  accessToken: string,
  payload: AdvisoryPayload
): Promise<AdvisoryResponse> => {
  const response = await client.post<ApiResponse<AdvisoryResponse>>("/advisory/chat", payload, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.data.success) {
    throw new Error(response.data.message || "Advisory request failed");
  }
  return response.data.data;
};

const authHeaders = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

export const fetchMobileCropRecommendation = async (
  accessToken: string,
  payload: CropRecommendationPayload
): Promise<CropRecommendationResponse> => {
  const response = await client.post<ApiResponse<CropRecommendationResponse>>("/recommendations/crop", payload, {
    headers: authHeaders(accessToken),
  });
  if (!response.data.success) {
    throw new Error(response.data.message || "Crop recommendation failed");
  }
  return response.data.data;
};

export const fetchMobilePriceForecast = async (
  accessToken: string,
  payload: PriceForecastPayload
): Promise<PriceForecastResponse> => {
  const response = await client.post<ApiResponse<PriceForecastResponse>>("/recommendations/price-forecast", payload, {
    headers: authHeaders(accessToken),
  });
  if (!response.data.success) {
    throw new Error(response.data.message || "Price forecast failed");
  }
  return response.data.data;
};

export const fetchMobileWaterOptimization = async (
  accessToken: string,
  payload: WaterOptimizationPayload
): Promise<WaterOptimizationResponse> => {
  const response = await client.post<ApiResponse<WaterOptimizationResponse>>(
    "/recommendations/water-optimization",
    payload,
    {
      headers: authHeaders(accessToken),
    }
  );
  if (!response.data.success) {
    throw new Error(response.data.message || "Water optimization failed");
  }
  return response.data.data;
};

export const submitMobileOutcomeFeedback = async (
  accessToken: string,
  payload: OutcomeFeedbackPayload
): Promise<OutcomeFeedbackResponse> => {
  const response = await client.post<ApiResponse<OutcomeFeedbackResponse>>("/feedback/outcome", payload, {
    headers: authHeaders(accessToken),
  });
  if (!response.data.success) {
    throw new Error(response.data.message || "Outcome feedback failed");
  }
  return response.data.data;
};
