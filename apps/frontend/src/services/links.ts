import type { ApiResponse } from "./api";
import { resolveRootBaseUrl } from "./runtimeConfig";

const rootBase = resolveRootBaseUrl(import.meta.env.VITE_API_BASE_URL as string | undefined);

export interface ExternalLinkCheckResponse {
  url: string;
  safe: boolean;
  verified: boolean;
  domain?: string | null;
  reason?: string | null;
  checked_at: string;
}

export const buildRedirectUrl = (url: string) => {
  const encoded = encodeURIComponent(url);
  return `${rootBase}/redirect?url=${encoded}`;
};

export const inspectExternalLink = async (url: string): Promise<ExternalLinkCheckResponse> => {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${rootBase}/redirect/inspect?url=${encoded}`);
  if (!response.ok) {
    throw new Error("Unable to inspect link");
  }
  const payload = (await response.json()) as ApiResponse<ExternalLinkCheckResponse>;
  if (!payload.success) {
    throw new Error(payload.message || "Unable to inspect link");
  }
  return payload.data;
};
