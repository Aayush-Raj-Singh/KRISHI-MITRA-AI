import axios from "axios";
import { getCached, setCached } from "./cache";
import {
  clearAuthTokens,
  clearStoredUser,
  getAccessToken,
  getRefreshToken,
  setAuthTokens
} from "./authStorage";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const offlineQueueKey = "krishimitra:offline_queue";
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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config as { _retry?: boolean; url?: string; headers?: Record<string, string> } | undefined;
    const status = error?.response?.status as number | undefined;
    const requestUrl = originalRequest?.url || "";
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

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.detail ||
      error?.message ||
      "Request failed";
    return Promise.reject(new Error(message));
  }
);

type OfflineQueueItem = { url: string; payload: unknown; ts: number };

const enqueueOfflineRequest = (url: string, payload: unknown) => {
  try {
    const raw = localStorage.getItem(offlineQueueKey);
    const queue: OfflineQueueItem[] = raw ? JSON.parse(raw) : [];
    queue.push({ url, payload, ts: Date.now() });
    localStorage.setItem(offlineQueueKey, JSON.stringify(queue));
  } catch {
    // ignore queue failures
  }
};

const flushOfflineQueue = async () => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  try {
    const raw = localStorage.getItem(offlineQueueKey);
    if (!raw) return;
    const queue: OfflineQueueItem[] = JSON.parse(raw);
    if (!queue.length) return;
    const remaining: OfflineQueueItem[] = [];
    for (const item of queue) {
      try {
        await api.post(item.url, item.payload);
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem(offlineQueueKey, JSON.stringify(remaining));
  } catch {
    // ignore queue failures
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
  enqueueOfflineRequest(url, payload);
};

export const unwrap = <T>(payload: ApiResponse<T>): T => {
  if (!payload.success) {
    throw new Error(payload.message || "Request failed");
  }
  return payload.data;
};

export const cachedPost = async <T, P>(key: string, url: string, payload: P): Promise<T> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueOfflineRequest(url, payload);
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
