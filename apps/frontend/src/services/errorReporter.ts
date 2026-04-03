import { resolveRootBaseUrl } from "./runtimeConfig";

type ClientErrorSource = "web";

type ClientErrorPayload = {
  source: ClientErrorSource;
  message: string;
  stack?: string;
  route?: string;
  url?: string;
  user_agent?: string;
  release?: string;
  extra?: Record<string, unknown>;
};

const isBrowser = typeof window !== "undefined";
const release = (import.meta.env.VITE_APP_RELEASE as string | undefined)?.trim() || "web-dev";

const buildEndpoint = () => {
  const explicit = (import.meta.env.VITE_ERROR_REPORTING_ENDPOINT as string | undefined)?.trim();
  if (explicit) {
    return explicit;
  }
  if (!isBrowser) {
    return "";
  }
  return `${resolveRootBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined)}/api/v1/public/client-errors`;
};

const endpoint = buildEndpoint();

const postPayload = (payload: ClientErrorPayload) => {
  if (!isBrowser || !endpoint || !navigator.onLine) {
    return;
  }

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  void fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
};

export const reportClientError = (error: unknown, extra?: Record<string, unknown>) => {
  const message = error instanceof Error ? error.message : String(error || "Unknown client error");
  const stack = error instanceof Error ? error.stack : undefined;
  postPayload({
    source: "web",
    message: message.slice(0, 500),
    stack: stack?.slice(0, 5000),
    route: isBrowser ? window.location.pathname : undefined,
    url: isBrowser ? window.location.href : undefined,
    user_agent: isBrowser ? navigator.userAgent : undefined,
    release,
    extra,
  });
};

export const initClientErrorTracking = () => {
  if (!isBrowser) {
    return;
  }

  window.addEventListener("error", (event) => {
    reportClientError(event.error ?? event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportClientError(event.reason, { type: "unhandledrejection" });
  });
};
