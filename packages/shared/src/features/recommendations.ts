import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type {
  CropRecommendationRequest,
  CropRecommendationResponse,
  PriceForecastRequest,
  PriceForecastResponse,
  WaterOptimizationRequest,
  WaterOptimizationResponse
} from "../contracts/recommendations";
import {
  sanitizeCropRecommendationPayload,
  sanitizePriceForecastPayload,
  sanitizeWaterOptimizationPayload
} from "../validators/recommendations";
import type { FeatureApiContext } from "./context";

export const createRecommendationApi = ({ api, unwrap }: FeatureApiContext) => ({
  getCropRecommendation: async (
    payload: CropRecommendationRequest
  ): Promise<CropRecommendationResponse> => {
    const response = await api.post<ApiEnvelope<CropRecommendationResponse>>(
      API_ENDPOINTS.recommendations.crop,
      sanitizeCropRecommendationPayload(payload)
    );
    return unwrap(response.data);
  },
  getPriceForecast: async (payload: PriceForecastRequest): Promise<PriceForecastResponse> => {
    const response = await api.post<ApiEnvelope<PriceForecastResponse>>(
      API_ENDPOINTS.recommendations.priceForecast,
      sanitizePriceForecastPayload(payload)
    );
    return unwrap(response.data);
  },
  getWaterOptimization: async (
    payload: WaterOptimizationRequest
  ): Promise<WaterOptimizationResponse> => {
    const response = await api.post<ApiEnvelope<WaterOptimizationResponse>>(
      API_ENDPOINTS.recommendations.waterOptimization,
      sanitizeWaterOptimizationPayload(payload)
    );
    return unwrap(response.data);
  }
});
