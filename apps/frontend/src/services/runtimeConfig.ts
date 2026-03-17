const isBrowser = typeof window !== "undefined";

const isLocalHost = () => {
  if (!isBrowser) return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
};

const isNativeShell = () => {
  if (!isBrowser) return false;
  return window.location.protocol === "capacitor:" || window.location.origin.startsWith("capacitor://");
};

const defaultNativeApiBase = () => {
  const explicit = (import.meta.env.VITE_MOBILE_API_BASE_URL as string | undefined)?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  return isAndroid ? "http://10.0.2.2:8000/api/v1" : "http://127.0.0.1:8000/api/v1";
};

const defaultNativeWsBase = () => {
  const explicit = (import.meta.env.VITE_MOBILE_WS_URL as string | undefined)?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
  return isAndroid ? "ws://10.0.2.2:8000/api/v1/ws/updates" : "ws://127.0.0.1:8000/api/v1/ws/updates";
};

export const resolveApiBaseUrl = (value?: string) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    if (isNativeShell()) {
      return defaultNativeApiBase();
    }
    if (isLocalHost()) {
      return "http://localhost:8000/api/v1";
    }
    return isBrowser ? `${window.location.origin}/api/v1` : "/api/v1";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed.replace(/\/$/, "");
  }

  if (isBrowser) {
    const prefix = trimmed.startsWith("/") ? "" : "/";
    return `${window.location.origin}${prefix}${trimmed}`.replace(/\/$/, "");
  }

  return trimmed.replace(/\/$/, "");
};

export const resolveRootBaseUrl = (value?: string) => {
  const apiBase = resolveApiBaseUrl(value);
  return apiBase.endsWith("/api/v1") ? apiBase.replace(/\/api\/v1$/, "") : apiBase;
};

export const resolveWsUrl = (value?: string) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    if (isNativeShell()) {
      return defaultNativeWsBase();
    }
    if (isBrowser) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      if (isLocalHost()) {
        return "ws://localhost:8000/api/v1/ws/updates";
      }
      return `${protocol}//${window.location.host}/api/v1/ws/updates`;
    }
    return "/api/v1/ws/updates";
  }

  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed.replace(/\/$/, "");
  }

  if (isBrowser) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const prefix = trimmed.startsWith("/") ? "" : "/";
    return `${protocol}//${window.location.host}${prefix}${trimmed}`.replace(/\/$/, "");
  }

  return trimmed.replace(/\/$/, "");
};
