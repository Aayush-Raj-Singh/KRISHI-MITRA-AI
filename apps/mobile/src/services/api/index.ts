import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  ApiError,
  API_ENDPOINTS,
  createAiAdvisorApi,
  type CropAdvisorRequest,
  type CropAdvisorResponse,
  createAdvisoryApi,
  createAuthApi,
  createDashboardApi,
  createDiseaseApi,
  createFeedbackApi,
  createKrishiMitraApi,
  createMarketApi,
  createRecommendationApi,
  createSupportApi,
} from "@krishimitra/shared";

import { useAuthStore } from "../../store/authStore";

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

const resolveServiceRootUrl = (baseUrl: string) => baseUrl.replace(/\/api\/v1$/i, "");

const resolveAiAdvisorRootUrl = (fallbackRootUrl: string) => {
  const configuredRoot =
    typeof Constants.expoConfig?.extra?.aiAdvisorBaseUrl === "string"
      ? Constants.expoConfig.extra.aiAdvisorBaseUrl
      : process.env.EXPO_PUBLIC_AI_ADVISOR_BASE_URL;
  const normalized = (configuredRoot || "").trim().replace(/\/+$/, "");
  if (!normalized) {
    return fallbackRootUrl;
  }
  return normalized.replace(/\/api\/ai\/advisor$/i, "");
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
  serviceRootURL: resolveServiceRootUrl(resolveBaseUrl()),
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

const { api: aiAdvisorHttp } = createKrishiMitraApi({
  baseURL: resolveAiAdvisorRootUrl(mobileApiConfig.serviceRootURL),
  onError: logApiError,
});

const sleep = (delayMs: number) => new Promise((resolve) => setTimeout(resolve, delayMs));

const isRetryableApiError = (error: unknown) =>
  error instanceof ApiError &&
  (error.status === undefined ||
    error.status === 408 ||
    error.status === 429 ||
    error.status >= 500);

export const withRetry = async <T>(
  task: () => Promise<T>,
  options?: {
    attempts?: number;
    delayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  },
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
export const marketApi = createMarketApi({ api, unwrap });
export const supportApi = createSupportApi({ api, unwrap });
export const aiAdvisorApi = createAiAdvisorApi({ api: aiAdvisorHttp });

export interface MandiEntry {
  _id: string;
  commodity: string;
  variety?: string;
  grade?: string;
  market: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrivals_qtl: number;
  status: string;
  state?: string;
  district?: string;
}

export interface MandiEntryList {
  items: MandiEntry[];
  total: number;
}

export interface DataQualityIssue {
  issue_type: string;
  severity: string;
  message: string;
  entry_id?: string;
  fields?: Record<string, unknown>;
  detected_at: string;
}

export interface DataQualitySummary {
  total: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

export interface DataQualityReport {
  issues: DataQualityIssue[];
  summary: DataQualitySummary;
  generated_at: string;
}

export interface AuditLogRecord {
  _id?: string;
  id?: string;
  action: string;
  entity: string;
  actor_id?: string;
  actor_role?: string;
  ts?: string;
}

const getUnwrapped = async <T>(url: string, params?: Record<string, unknown>) =>
  unwrap((await api.get<any>(url, { params })).data) as T;

const postUnwrapped = async <T>(url: string, body?: unknown, params?: Record<string, unknown>) =>
  unwrap((await api.post<any>(url, body, { params })).data) as T;

const patchUnwrapped = async <T>(url: string, body?: unknown, params?: Record<string, unknown>) =>
  unwrap((await api.patch<any>(url, body, { params })).data) as T;

export const operationsApi = {
  getMandiEntries: (params?: {
    status?: string;
    market?: string;
    commodity?: string;
    limit?: number;
    skip?: number;
  }) => getUnwrapped<MandiEntryList>("/mandi/entries", params),
  createMandiEntry: (payload: Record<string, unknown>) =>
    postUnwrapped<MandiEntry>("/mandi/entries", payload),
  submitMandiEntry: (entryId: string) =>
    postUnwrapped<MandiEntry>(`/mandi/entries/${entryId}/submit`),
  approveMandiEntry: (entryId: string) =>
    postUnwrapped<MandiEntry>(`/mandi/entries/${entryId}/approve`),
  rejectMandiEntry: (entryId: string, reason?: string) =>
    postUnwrapped<MandiEntry>(
      `/mandi/entries/${entryId}/reject`,
      {},
      reason ? { reason } : undefined,
    ),
  getQualityReport: (params?: {
    state?: string;
    district?: string;
    mandi?: string;
    commodity?: string;
    date_from?: string;
    date_to?: string;
  }) => getUnwrapped<DataQualityReport>("/quality/mandi", params),
  getQualityIssues: () => getUnwrapped<DataQualityIssue[]>("/quality/issues"),
  getAuditLogs: (params?: { limit?: number }) => getUnwrapped<AuditLogRecord[]>("/audit", params),
};

export const masterDataApi = {
  getCommodities: () => getUnwrapped<Record<string, unknown>[]>("/master/commodities"),
  createCommodity: (payload: {
    name: string;
    code: string;
    categories: string[];
    active: boolean;
  }) => postUnwrapped<Record<string, unknown>>("/master/commodities", payload),
  updateCommodity: (id: string, payload: Record<string, unknown>) =>
    patchUnwrapped<Record<string, unknown>>(`/master/commodities/${id}`, payload),
  getVarieties: (params?: { commodity_id?: string }) =>
    getUnwrapped<Record<string, unknown>[]>("/master/varieties", params),
  createVariety: (payload: { commodity_id: string; name: string; code: string; active: boolean }) =>
    postUnwrapped<Record<string, unknown>>("/master/varieties", payload),
  updateVariety: (id: string, payload: Record<string, unknown>) =>
    patchUnwrapped<Record<string, unknown>>(`/master/varieties/${id}`, payload),
  getGrades: (params?: { commodity_id?: string }) =>
    getUnwrapped<Record<string, unknown>[]>("/master/grades", params),
  createGrade: (payload: { commodity_id: string; name: string; code: string; active: boolean }) =>
    postUnwrapped<Record<string, unknown>>("/master/grades", payload),
  updateGrade: (id: string, payload: Record<string, unknown>) =>
    patchUnwrapped<Record<string, unknown>>(`/master/grades/${id}`, payload),
  getUnits: () => getUnwrapped<Record<string, unknown>[]>("/master/units"),
  createUnit: (payload: { name: string; symbol: string; type: string }) =>
    postUnwrapped<Record<string, unknown>>("/master/units", payload),
  updateUnit: (id: string, payload: Record<string, unknown>) =>
    patchUnwrapped<Record<string, unknown>>(`/master/units/${id}`, payload),
  getSeasons: () => getUnwrapped<Record<string, unknown>[]>("/master/seasons"),
  createSeason: (payload: {
    name: string;
    start_month: number;
    end_month: number;
    active: boolean;
  }) => postUnwrapped<Record<string, unknown>>("/master/seasons", payload),
  updateSeason: (id: string, payload: Record<string, unknown>) =>
    patchUnwrapped<Record<string, unknown>>(`/master/seasons/${id}`, payload),
  getMspRates: (params?: { commodity_id?: string; season?: string }) =>
    getUnwrapped<Record<string, unknown>[]>("/master/msp", params),
  createMspRate: (payload: {
    commodity_id: string;
    variety_id?: string;
    season: string;
    price_per_quintal: number;
    source?: string;
    effective_from?: string;
  }) => postUnwrapped<Record<string, unknown>>("/master/msp", payload),
  updateMspRate: (id: string, payload: Record<string, unknown>) =>
    patchUnwrapped<Record<string, unknown>>(`/master/msp/${id}`, payload),
};
