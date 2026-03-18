import {
  API_ENDPOINTS,
  sanitizeCropRecommendationPayload,
  sanitizePriceForecastPayload,
  sanitizeWaterOptimizationPayload,
  type CropRecommendationRequest,
  type CropRecommendationResponse,
  type PriceForecastRequest,
  type PriceForecastResponse,
  type WaterOptimizationRequest,
  type WaterOptimizationResponse,
} from "@krishimitra/shared";

import { cachedPost } from "./api";

export type {
  CropRecommendationRequest,
  CropRecommendationResponse,
  PriceForecastRequest,
  PriceForecastResponse,
  WaterOptimizationRequest,
  WaterOptimizationResponse,
  WeatherDay
} from "@krishimitra/shared";

export const fetchCropRecommendation = async (
  payload: CropRecommendationRequest
): Promise<CropRecommendationResponse> => {
  const key = `crop:${JSON.stringify(payload)}`;
  return cachedPost<CropRecommendationResponse, CropRecommendationRequest>(
    key,
    API_ENDPOINTS.recommendations.crop,
    sanitizeCropRecommendationPayload(payload)
  );
};

export const fetchPriceForecast = async (
  payload: PriceForecastRequest
): Promise<PriceForecastResponse> => {
  const key = `price:${JSON.stringify(payload)}`;
  return cachedPost<PriceForecastResponse, PriceForecastRequest>(
    key,
    API_ENDPOINTS.recommendations.priceForecast,
    sanitizePriceForecastPayload(payload)
  );
};

export const fetchWaterOptimization = async (
  payload: WaterOptimizationRequest
): Promise<WaterOptimizationResponse> => {
  const key = `water:${JSON.stringify(payload)}`;
  return cachedPost<WaterOptimizationResponse, WaterOptimizationRequest>(
    key,
    API_ENDPOINTS.recommendations.waterOptimization,
    sanitizeWaterOptimizationPayload(payload)
  );
};
