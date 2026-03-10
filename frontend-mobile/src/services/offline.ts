import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  CropRecommendationResponse,
  PriceForecastResponse,
  WaterOptimizationResponse,
} from "./api";

export interface MobileChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  queued?: boolean;
}

export interface QueuedChatRequest {
  id: string;
  message: string;
  language: string;
  createdAt: string;
}

const ACCESS_TOKEN_KEY = "km_mobile_access_token";
const CHAT_CACHE_KEY = "km_mobile_chat_cache";
const CHAT_QUEUE_KEY = "km_mobile_chat_queue";
const CROP_CACHE_KEY = "km_mobile_crop_cache";
const PRICE_CACHE_KEY = "km_mobile_price_cache";
const WATER_CACHE_KEY = "km_mobile_water_cache";

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getStoredAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setStoredAccessToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearStoredAccessToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getCachedChatMessages = async (): Promise<MobileChatMessage[]> => {
  const raw = await AsyncStorage.getItem(CHAT_CACHE_KEY);
  return safeParse<MobileChatMessage[]>(raw, []);
};

export const setCachedChatMessages = async (messages: MobileChatMessage[]): Promise<void> => {
  await AsyncStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages.slice(-200)));
};

export const getQueuedChatRequests = async (): Promise<QueuedChatRequest[]> => {
  const raw = await AsyncStorage.getItem(CHAT_QUEUE_KEY);
  return safeParse<QueuedChatRequest[]>(raw, []);
};

export const setQueuedChatRequests = async (items: QueuedChatRequest[]): Promise<void> => {
  await AsyncStorage.setItem(CHAT_QUEUE_KEY, JSON.stringify(items.slice(-100)));
};

export const enqueueChatRequest = async (item: QueuedChatRequest): Promise<void> => {
  const queue = await getQueuedChatRequests();
  queue.push(item);
  await setQueuedChatRequests(queue);
};

export const removeQueuedChatRequest = async (id: string): Promise<void> => {
  const queue = await getQueuedChatRequests();
  await setQueuedChatRequests(queue.filter((item) => item.id !== id));
};

const setCachedResult = async <T>(key: string, value: T): Promise<void> => {
  await AsyncStorage.setItem(key, JSON.stringify({ value, ts: Date.now() }));
};

const getCachedResult = async <T>(key: string): Promise<{ value: T; ts: number } | null> => {
  const raw = await AsyncStorage.getItem(key);
  return safeParse<{ value: T; ts: number } | null>(raw, null);
};

export const setCachedCropRecommendation = async (value: CropRecommendationResponse): Promise<void> => {
  await setCachedResult(CROP_CACHE_KEY, value);
};

export const getCachedCropRecommendation = async () => {
  return getCachedResult<CropRecommendationResponse>(CROP_CACHE_KEY);
};

export const setCachedPriceForecast = async (value: PriceForecastResponse): Promise<void> => {
  await setCachedResult(PRICE_CACHE_KEY, value);
};

export const getCachedPriceForecast = async () => {
  return getCachedResult<PriceForecastResponse>(PRICE_CACHE_KEY);
};

export const setCachedWaterOptimization = async (value: WaterOptimizationResponse): Promise<void> => {
  await setCachedResult(WATER_CACHE_KEY, value);
};

export const getCachedWaterOptimization = async () => {
  return getCachedResult<WaterOptimizationResponse>(WATER_CACHE_KEY);
};
