import { API_ENDPOINTS } from "../constants/endpoints";
import type { TokenResponse } from "../contracts/auth";
import type { ApiEnvelope, ApiRequestOptions } from "../contracts/common";

export interface HttpErrorResponse {
  status: number;
  data?: unknown;
  headers?: Headers;
}

export interface HttpRequestDescriptor extends ApiRequestOptions {
  baseURL: string;
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  timeoutMs: number;
  body?: unknown;
  _retry?: boolean;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

export interface HttpClient {
  get: <T>(url: string, config?: ApiRequestOptions) => Promise<HttpResponse<T>>;
  post: <T>(url: string, body?: unknown, config?: ApiRequestOptions) => Promise<HttpResponse<T>>;
  patch: <T>(url: string, body?: unknown, config?: ApiRequestOptions) => Promise<HttpResponse<T>>;
  put: <T>(url: string, body?: unknown, config?: ApiRequestOptions) => Promise<HttpResponse<T>>;
  delete: <T>(url: string, config?: ApiRequestOptions) => Promise<HttpResponse<T>>;
}

export class ApiError extends Error {
  status?: number;
  details?: unknown;
  config?: HttpRequestDescriptor;
  response?: HttpErrorResponse;

  constructor(
    message: string,
    status?: number,
    details?: unknown,
    config?: HttpRequestDescriptor,
    response?: HttpErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.config = config;
    this.response = response;
  }
}

export interface ApiSessionAdapter {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (tokens: Pick<TokenResponse, "access_token" | "refresh_token">) => void;
  clear: () => void;
}

export interface ApiClientErrorContext {
  message: string;
  status?: number;
  details?: unknown;
  error: unknown;
}

export interface CreateKrishiMitraApiOptions {
  baseURL: string;
  timeoutMs?: number;
  session?: ApiSessionAdapter;
  onError?: (context: ApiClientErrorContext) => void;
  isAuthEndpoint?: (url: string) => boolean;
}

const isFormData = (value: unknown): value is FormData =>
  typeof FormData !== "undefined" && value instanceof FormData;

const isBlob = (value: unknown): value is Blob =>
  typeof Blob !== "undefined" && value instanceof Blob;

const extractErrorMessage = (error: unknown): string => {
  const apiError = error as ApiError;
  const responseData = apiError?.response?.data as any;
  const detail = responseData?.detail;

  if (typeof responseData?.message === "string" && responseData.message) {
    return responseData.message;
  }
  if (typeof detail === "string" && detail) {
    return detail;
  }
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : null))
      .filter(Boolean);
    if (messages.length > 0) {
      return messages.join(", ");
    }
  }
  if (typeof apiError?.message === "string") {
    if (
      apiError.message === "Network Error" ||
      apiError.message === "Failed to fetch" ||
      apiError.message === "Network request failed"
    ) {
      return "Unable to reach the server. Please check that the API is available.";
    }
    return apiError.message;
  }
  return "Request failed";
};

const defaultIsAuthEndpoint = (url: string) =>
  [
    API_ENDPOINTS.auth.login,
    API_ENDPOINTS.auth.register,
    API_ENDPOINTS.auth.refresh,
    API_ENDPOINTS.auth.refreshAlias
  ].some((endpoint) => url.includes(endpoint));

export const unwrapApiEnvelope = <T>(payload: ApiEnvelope<T>): T => {
  if (!payload.success) {
    throw new ApiError(payload.message || "Request failed");
  }
  return payload.data;
};

const appendQueryString = (url: string, params?: object) => {
  if (!params) {
    return url;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      });
      return;
    }
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  if (!query) {
    return url;
  }
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
};

const resolveRequestUrl = (baseURL: string, url: string, params?: object) => {
  const target = /^https?:\/\//i.test(url)
    ? url
    : `${baseURL.replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
  return appendQueryString(target, params);
};

const toHeaders = (headers?: Record<string, string>) => {
  const normalized = new Headers();
  Object.entries(headers || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      normalized.set(key, value);
    }
  });
  return normalized;
};

const parseResponseBody = async (
  response: Response,
  responseType: ApiRequestOptions["responseType"] = "json"
): Promise<unknown> => {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  if (responseType === "blob") {
    return response.blob();
  }
  if (responseType === "text") {
    return response.text();
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    return response.json();
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const buildDetails = (payload: any) =>
  payload?.data?.errors || payload?.detail || payload?.data || payload;

const buildError = (descriptor: HttpRequestDescriptor, status?: number, data?: unknown, headers?: Headers) => {
  const response = status
    ? {
        status,
        data,
        headers
      }
    : undefined;
  const error = new ApiError("Request failed", status, buildDetails(data), descriptor, response);
  error.message = extractErrorMessage(error);
  return error;
};

const sendRequest = async <T>(
  descriptor: HttpRequestDescriptor,
  accessToken?: string | null
): Promise<HttpResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), descriptor.timeoutMs);

  if (descriptor.signal) {
    if (descriptor.signal.aborted) {
      controller.abort();
    } else {
      descriptor.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  const headers = toHeaders(descriptor.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  let body: BodyInit | undefined;
  if (descriptor.body !== undefined && descriptor.body !== null) {
    if (isFormData(descriptor.body)) {
      headers.delete("Content-Type");
      body = descriptor.body;
    } else if (isBlob(descriptor.body)) {
      body = descriptor.body;
    } else if (typeof descriptor.body === "string") {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain;charset=UTF-8");
      }
      body = descriptor.body;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(descriptor.body);
    }
  }

  try {
    const response = await fetch(resolveRequestUrl(descriptor.baseURL, descriptor.url, descriptor.params), {
      method: descriptor.method,
      headers,
      body,
      signal: controller.signal
    });
    const data = await parseResponseBody(response, descriptor.responseType);

    if (!response.ok) {
      throw buildError(descriptor, response.status, data, response.headers);
    }

    return {
      data: data as T,
      status: response.status,
      headers: response.headers
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const name =
      typeof error === "object" && error && "name" in error ? String((error as { name?: string }).name) : "";
    if (name === "AbortError") {
      throw new ApiError("Request timed out", undefined, undefined, descriptor);
    }

    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message)
        : "Request failed";
    throw new ApiError(message, undefined, undefined, descriptor);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createKrishiMitraApi = ({
  baseURL,
  timeoutMs = 15000,
  session,
  onError,
  isAuthEndpoint = defaultIsAuthEndpoint
}: CreateKrishiMitraApiOptions): { api: HttpClient; unwrap: typeof unwrapApiEnvelope } => {
  let refreshPromise: Promise<string | null> | null = null;

  const clearSession = () => {
    session?.clear();
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!session) {
      return null;
    }

    const refreshToken = session.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    if (!refreshPromise) {
      refreshPromise = sendRequest<ApiEnvelope<Pick<TokenResponse, "access_token" | "refresh_token">>>(
        {
          baseURL,
          url: API_ENDPOINTS.auth.refresh,
          method: "POST",
          timeoutMs,
          body: {
            refresh_token: refreshToken
          }
        }
      )
        .then((response) => {
          const data = unwrapApiEnvelope(response.data);
          if (!data.access_token || !data.refresh_token) {
            clearSession();
            return null;
          }
          session.setTokens(data);
          return data.access_token;
        })
        .catch(() => {
          clearSession();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  };

  const request = async <T>(
    method: HttpRequestDescriptor["method"],
    url: string,
    body?: unknown,
    config?: ApiRequestOptions,
    retry = true
  ): Promise<HttpResponse<T>> => {
    const descriptor: HttpRequestDescriptor = {
      baseURL,
      url,
      method,
      timeoutMs,
      body,
      headers: config?.headers,
      params: config?.params,
      signal: config?.signal,
      _retry: !retry
    };

    try {
      return await sendRequest<T>(descriptor, session?.getAccessToken());
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(extractErrorMessage(error), undefined, undefined, descriptor);

      if (apiError.status === 401 && session && retry && !isAuthEndpoint(url)) {
        const token = await refreshAccessToken();
        if (token) {
          return sendRequest<T>({ ...descriptor, _retry: true }, token);
        }
      }

      onError?.({
        message: extractErrorMessage(apiError),
        status: apiError.status,
        details: apiError.details,
        error: apiError
      });
      throw apiError;
    }
  };

  return {
    api: {
      get: (url, config) => request("GET", url, undefined, config),
      post: (url, body, config) => request("POST", url, body, config),
      patch: (url, body, config) => request("PATCH", url, body, config),
      put: (url, body, config) => request("PUT", url, body, config),
      delete: (url, config) => request("DELETE", url, undefined, config)
    },
    unwrap: unwrapApiEnvelope
  };
};
