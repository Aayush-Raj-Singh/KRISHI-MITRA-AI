import type {
  CropRecommendationRequest,
  PriceForecastRequest,
  WaterOptimizationRequest,
  WeatherDay
} from "../contracts/recommendations";
import { ensureMinValue, ensureRange, requireText, toFiniteNumber } from "./shared";

const sanitizeWeatherDay = (item: WeatherDay): WeatherDay => ({
  date: requireText(item.date, "Forecast date"),
  rainfall_mm: ensureMinValue(toFiniteNumber(item.rainfall_mm, "Rainfall"), 0, "Rainfall"),
  temperature_c: toFiniteNumber(item.temperature_c, "Temperature")
});

export const sanitizeCropRecommendationPayload = (
  payload: CropRecommendationRequest
): CropRecommendationRequest => ({
  ...payload,
  soil_n: ensureMinValue(toFiniteNumber(payload.soil_n, "Soil N"), 0, "Soil N"),
  soil_p: ensureMinValue(toFiniteNumber(payload.soil_p, "Soil P"), 0, "Soil P"),
  soil_k: ensureMinValue(toFiniteNumber(payload.soil_k, "Soil K"), 0, "Soil K"),
  soil_ph: ensureRange(toFiniteNumber(payload.soil_ph, "Soil pH"), 0, 14, "Soil pH"),
  temperature_c: toFiniteNumber(payload.temperature_c, "Temperature"),
  humidity_pct: ensureRange(toFiniteNumber(payload.humidity_pct, "Humidity"), 0, 100, "Humidity"),
  rainfall_mm: ensureMinValue(toFiniteNumber(payload.rainfall_mm, "Rainfall"), 0, "Rainfall"),
  location: requireText(payload.location, "Location"),
  season: payload.season ? requireText(payload.season, "Season") : undefined,
  historical_yield:
    payload.historical_yield === null || payload.historical_yield === undefined
      ? payload.historical_yield
      : toFiniteNumber(payload.historical_yield, "Historical yield")
});

export const sanitizePriceForecastPayload = (payload: PriceForecastRequest): PriceForecastRequest => ({
  crop: requireText(payload.crop, "Crop"),
  market: requireText(payload.market, "Market"),
  currency: requireText(payload.currency || "INR", "Currency").toUpperCase()
});

export const sanitizeWaterOptimizationPayload = (
  payload: WaterOptimizationRequest
): WaterOptimizationRequest => ({
  ...payload,
  crop: requireText(payload.crop, "Crop"),
  growth_stage: requireText(payload.growth_stage, "Growth stage"),
  soil_moisture_pct: ensureRange(
    toFiniteNumber(payload.soil_moisture_pct, "Soil moisture"),
    0,
    100,
    "Soil moisture"
  ),
  water_source: requireText(payload.water_source, "Water source"),
  field_area_acres: ensureMinValue(
    toFiniteNumber(payload.field_area_acres, "Field area"),
    0.01,
    "Field area"
  ),
  forecast: payload.forecast?.map(sanitizeWeatherDay),
  location: payload.location ? requireText(payload.location, "Location") : undefined,
  days: payload.days === undefined ? undefined : ensureRange(toFiniteNumber(payload.days, "Days"), 1, 14, "Days")
});
