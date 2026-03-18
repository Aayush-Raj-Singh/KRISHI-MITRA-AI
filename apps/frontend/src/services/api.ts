import {
  ApiError,
  createKrishiMitraApi,
  type ApiEnvelope,
} from "@krishimitra/shared";
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

export type ApiResponse<T> = ApiEnvelope<T>;

const baseURL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);

const clearAuthStorage = () => {
  clearAuthTokens();
  clearStoredUser();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
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

const { api, unwrap } = createKrishiMitraApi({
  baseURL,
  session: {
    getAccessToken,
    getRefreshToken,
    setTokens: (tokens) => setAuthTokens(tokens.access_token, tokens.refresh_token),
    clear: clearAuthStorage
  },
  onError: ({ message, error }) => logApiError(error, message)
});

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

export { ApiError, unwrap };
export default api;
