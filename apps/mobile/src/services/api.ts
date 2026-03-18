import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  ApiError,
  createAdvisoryApi,
  createAuthApi,
  createDashboardApi,
  createDiseaseApi,
  createFeedbackApi,
  createKrishiMitraApi,
  createRecommendationApi,
} from "@krishimitra/shared";

import { useAuthStore } from "../store/authStore";

const normalizeApiBaseUrl = (value?: string | null) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }

  const normalized = trimmed.replace(/\/+$/, "");
  return /\/api\/v1$/i.test(normalized) ? normalized : `${normalized}/api/v1`;
};

const resolveFallbackBaseUrl = () =>
  Platform.OS === "android" ? "http://10.0.2.2:8000/api/v1" : "http://localhost:8000/api/v1";

const resolveBaseUrl = () => {
  const expoExtraBaseUrl =
    typeof Constants.expoConfig?.extra?.apiBaseUrl === "string"
      ? Constants.expoConfig.extra.apiBaseUrl
      : undefined;

  return (
    normalizeApiBaseUrl(expoExtraBaseUrl) ||
    normalizeApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) ||
    resolveFallbackBaseUrl()
  );
};

const logApiError = ({
  message,
  status,
  details,
}: {
  message: string;
  status?: number;
  details?: unknown;
}) => {
  const prefix = status ? `[mobile-api:${status}]` : "[mobile-api]";
  if (details !== undefined) {
    console.warn(prefix, message, details);
    return;
  }
  console.warn(prefix, message);
};

export const mobileApiConfig = {
  baseURL: resolveBaseUrl(),
};

const { api, unwrap } = createKrishiMitraApi({
  baseURL: mobileApiConfig.baseURL,
  session: {
    getAccessToken: () => useAuthStore.getState().accessToken,
    getRefreshToken: () => useAuthStore.getState().refreshToken,
    setTokens: (tokens) => useAuthStore.getState().setTokens(tokens),
    clear: () => useAuthStore.getState().logout(),
  },
  onError: logApiError,
});

const sleep = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs));

const isRetryableApiError = (error: unknown) =>
  error instanceof ApiError &&
  (error.status === undefined || error.status === 408 || error.status === 429 || error.status >= 500);

export const withRetry = async <T>(
  task: () => Promise<T>,
  options?: {
    attempts?: number;
    delayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> => {
  const attempts = Math.max(1, options?.attempts ?? 2);
  const delayMs = Math.max(0, options?.delayMs ?? 500);
  const shouldRetry = options?.shouldRetry ?? isRetryableApiError;

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetry(error)) {
        throw error;
      }
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
};

export const authApi = createAuthApi({ api, unwrap });
export const dashboardApi = createDashboardApi({ api, unwrap });
export const recommendationApi = createRecommendationApi({ api, unwrap });
export const advisoryApi = createAdvisoryApi({ api, unwrap });
export const diseaseApi = createDiseaseApi({ api, unwrap });
export const feedbackApi = createFeedbackApi({ api, unwrap });
