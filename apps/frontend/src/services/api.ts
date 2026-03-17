import axios from "axios";
import { getCached, setCached } from "./cache";
import {
  clearAuthTokens,
  clearStoredUser,
  getAccessToken,
  getRefreshToken,
  setAuthTokens
} from "./authStorage";
import { resolveApiBaseUrl } from "./runtimeConfig";
import {
  enqueueOfflineMutation,
  listOfflineMutations,
  removeOfflineMutation,
  updateOfflineMutation
} from "../utils/offlineStorage";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const baseURL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);
let refreshPromise: Promise<string | null> | null = null;

const api = axios.create({
  baseURL,
  timeout: 15000
});
const refreshApi = axios.create({
  baseURL,
  timeout: 15000
});

const clearAuthStorage = () => {
  clearAuthTokens();
  clearStoredUser();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (!refreshPromise) {
    refreshPromise = refreshApi
      .post<ApiResponse<{ access_token: string; refresh_token: string }>>("/auth/refresh", {
        refresh_token: refreshToken
      })
      .then((response) => {
        if (!response.data.success || !response.data.data?.access_token || !response.data.data?.refresh_token) {
          clearAuthStorage();
          return null;
        }
        setAuthTokens(response.data.data.access_token, response.data.data.refresh_token);
        return response.data.data.access_token;
      })
      .catch(() => {
        clearAuthStorage();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const extractErrorMessage = (error: any) => {
  const responseData = error?.response?.data;
  const detail = responseData?.detail;
  if (typeof responseData?.message === "string" && responseData.message) {
    return responseData.message;
  }
  if (typeof detail === "string" && detail) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const detailMessages = detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : null))
      .filter(Boolean);
    if (detailMessages.length) return detailMessages.join(", ");
  }
  if (Array.isArray(responseData?.data?.errors)) {
    const detailMessages = responseData.data.errors
      .map((item: { msg?: string }) => (typeof item?.msg === "string" ? item.msg : null))
      .filter(Boolean);
    if (detailMessages.length) return detailMessages.join(", ");
  }
  if (typeof error?.message === "string") {
    if (error.message === "Network Error") {
      return "Unable to reach the server. Please check the backend URL and that the API is running.";
    }
    return error.message;
  }
  return "Request failed";
};

const logApiError = (error: any, message: string) => {
  if (!import.meta.env.DEV) return;
  try {
    const method = error?.config?.method;
    const url = error?.config?.baseURL
      ? new URL(error?.config?.url ?? "", error?.config?.baseURL).toString()
      : error?.config?.url;
    const status = error?.response?.status;
    console.error("api_request_failed", { method, url, status, message, data: error?.response?.data });
  } catch {
    console.error("api_request_failed", { message });
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as { _retry?: boolean; url?: string; headers?: Record<string, string> } | undefined;
    const status = error?.response?.status as number | undefined;
    const requestUrl = originalRequest?.url || "";
    const responseData = error?.response?.data;
    const details =
      responseData?.data?.errors ||
      responseData?.detail ||
      responseData?.data ||
      responseData;
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const accessToken = await refreshAccessToken();
      if (accessToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }
    }

    const message = extractErrorMessage(error);
    logApiError(error, message);
    return Promise.reject(new ApiError(message, status, details));
  }
);

const flushOfflineQueue = async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  const queue = await listOfflineMutations();
  if (!queue.length) return;

  for (const item of queue) {
    try {
      await api.post(item.url, item.payload);
      await removeOfflineMutation(item.id);
    } catch {
      await updateOfflineMutation({
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString()
      });
    }
  }
};

export const initOfflineSync = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    flushOfflineQueue();
  });
  flushOfflineQueue();
};

export const queueOfflineRequest = (url: string, payload: unknown) => {
  void enqueueOfflineMutation(url, payload);
};

export const unwrap = <T>(payload: ApiResponse<T>): T => {
  if (!payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data;
};

export const cachedPost = async <T, P>(key: string, url: string, payload: P): Promise<T> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await enqueueOfflineMutation(url, payload);
    const cached = getCached<T>(key);
    if (cached) {
      return cached;
    }
    throw new Error("Offline: request queued");
  }
  try {
    const response = await api.post<ApiResponse<T>>(url, payload);
    const data = unwrap(response.data);
    setCached(key, data);
    return data;
  } catch (error) {
    const cached = getCached<T>(key);
    if (cached) {
      return cached;
    }
    throw error;
  }
};

export default api;
