import Constants from "expo-constants";
import { Platform } from "react-native";

import { mobileApiConfig } from "./api";

type ClientErrorPayload = {
  source: "mobile";
  message: string;
  stack?: string;
  route?: string;
  url?: string;
  user_agent?: string;
  release?: string;
  extra?: Record<string, unknown>;
};

const release =
  process.env.EXPO_PUBLIC_APP_RELEASE?.trim() || Constants.expoConfig?.version || "mobile-dev";

const endpoint = (() => {
  const explicit = process.env.EXPO_PUBLIC_ERROR_REPORTING_ENDPOINT?.trim();
  if (explicit) {
    return explicit;
  }
  return `${mobileApiConfig.baseURL.replace(/\/api\/v1$/i, "")}/api/v1/public/client-errors`;
})();

const postPayload = (payload: ClientErrorPayload) => {
  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
};

export const reportClientError = (error: unknown, extra?: Record<string, unknown>) => {
  const message = error instanceof Error ? error.message : String(error || "Unknown mobile error");
  const stack = error instanceof Error ? error.stack : undefined;

  postPayload({
    source: "mobile",
    message: message.slice(0, 500),
    stack: stack?.slice(0, 5000),
    user_agent: `expo/${Platform.OS}`,
    url: endpoint,
    release,
    extra,
  });
};

export const initClientErrorTracking = () => {
  const errorUtils = (
    globalThis as typeof globalThis & {
      ErrorUtils?: {
        getGlobalHandler?: () => (error: unknown, isFatal?: boolean) => void;
        setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
      };
    }
  ).ErrorUtils;

  if (!errorUtils?.setGlobalHandler) {
    return;
  }

  const existing = errorUtils.getGlobalHandler?.();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reportClientError(error, { type: "global", isFatal: Boolean(isFatal) });
    existing?.(error, isFatal);
  });
};
