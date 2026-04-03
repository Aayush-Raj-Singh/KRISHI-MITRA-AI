import type { ApiRequestOptions } from "@krishimitra/shared";
import api, { ApiResponse, queueOfflineRequest, unwrap } from "./api";
import { getOfflineRecord, isOnline, saveOfflineRecord } from "../utils/offlineStorage";

export type CachedResult<T> = {
  data: T;
  meta: {
    cached: boolean;
    stale: boolean;
    offline: boolean;
    updatedAt?: string;
  };
};

type CacheOptions = {
  store?: "weather" | "mandi" | "api";
  key?: string;
  ttlMs?: number;
  retry?: number;
  queueOnOffline?: boolean;
  registerSync?: boolean;
};

const DEFAULT_TTL = 1000 * 60 * 10;
const revalidators = new Map<string, () => Promise<void>>();

const buildCacheKey = (url: string, params?: unknown) => {
  if (!params) return url;
  try {
    return `${url}?${JSON.stringify(params)}`;
  } catch {
    return url;
  }
};

const withRetry = async <T>(fn: () => Promise<T>, retry = 1): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retry; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retry) {
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }
  }
  throw lastError;
};

export const cachedGet = async <T>(
  url: string,
  config?: ApiRequestOptions,
  options?: CacheOptions,
): Promise<CachedResult<T>> => {
  const store = options?.store || "api";
  const key = options?.key || buildCacheKey(url, config?.params);
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL;
  const shouldRegister = options?.registerSync !== false && typeof window !== "undefined";
  if (shouldRegister && !revalidators.has(key)) {
    revalidators.set(key, () =>
      cachedGet(url, config, { ...options, registerSync: false }).then(() => undefined),
    );
  }
  const cached = await getOfflineRecord<T>(store, key);
  const isFresh = cached && Date.now() - new Date(cached.updatedAt).getTime() < ttlMs;

  if (!isOnline()) {
    if (cached) {
      return {
        data: cached.value,
        meta: { cached: true, stale: !isFresh, offline: true, updatedAt: cached.updatedAt },
      };
    }
    throw new Error("Offline: no cached data available");
  }

  if (cached && isFresh) {
    return {
      data: cached.value,
      meta: { cached: true, stale: false, offline: false, updatedAt: cached.updatedAt },
    };
  }

  try {
    const response = await withRetry(
      () => api.get<ApiResponse<T>>(url, config),
      options?.retry ?? 1,
    );
    const data = unwrap(response.data);
    await saveOfflineRecord(store, key, data);
    return {
      data,
      meta: { cached: false, stale: false, offline: false, updatedAt: new Date().toISOString() },
    };
  } catch (error) {
    if (cached) {
      return {
        data: cached.value,
        meta: { cached: true, stale: true, offline: false, updatedAt: cached.updatedAt },
      };
    }
    throw error;
  }
};

export const initApiClientSync = () => {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    revalidators.forEach((fn) => {
      void fn();
    });
  });
};

export const cachedPost = async <T, P>(
  url: string,
  payload: P,
  config?: ApiRequestOptions,
  options?: CacheOptions,
): Promise<CachedResult<T>> => {
  const store = options?.store || "api";
  const key = options?.key || buildCacheKey(url, payload);
  const cached = await getOfflineRecord<T>(store, key);

  if (!isOnline()) {
    if (options?.queueOnOffline) {
      queueOfflineRequest(url, payload);
    }
    if (cached) {
      return {
        data: cached.value,
        meta: { cached: true, stale: true, offline: true, updatedAt: cached.updatedAt },
      };
    }
    throw new Error("Offline: request queued");
  }

  const response = await withRetry(
    () => api.post<ApiResponse<T>>(url, payload, config),
    options?.retry ?? 1,
  );
  const data = unwrap(response.data);
  await saveOfflineRecord(store, key, data);
  return {
    data,
    meta: { cached: false, stale: false, offline: false, updatedAt: new Date().toISOString() },
  };
};
