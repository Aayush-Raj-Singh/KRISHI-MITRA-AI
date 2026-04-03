import {
  API_ENDPOINTS,
  type PlatformBlueprintResponse,
  type PlatformSubscriptionTier,
  type PlatformWorkspaceFilters,
  type PlatformWorkspaceResponse,
} from "@krishimitra/shared";

import api, { ApiResponse, unwrap } from "./api";
import { cachedGet } from "./apiClient";

export const fetchPlatformBlueprint = async (): Promise<PlatformBlueprintResponse> => {
  const result = await cachedGet<PlatformBlueprintResponse>(
    API_ENDPOINTS.platform.blueprint,
    undefined,
    { store: "api", key: "platform:blueprint", ttlMs: 1000 * 60 * 60 },
  );
  return result.data;
};

export const fetchPlatformWorkspace = async (
  filters: PlatformWorkspaceFilters,
): Promise<PlatformWorkspaceResponse> => {
  const cacheKey = [
    "platform:workspace",
    filters.persona || "",
    filters.state || "",
    filters.district || "",
    filters.crop || "",
    filters.lat ?? "",
    filters.lon ?? "",
  ].join(":");
  const result = await cachedGet<PlatformWorkspaceResponse>(
    API_ENDPOINTS.platform.workspace,
    { params: filters },
    { store: "api", key: cacheKey, ttlMs: 1000 * 60 * 5 },
  );
  return result.data;
};

export const fetchPlatformSubscriptions = async (): Promise<PlatformSubscriptionTier[]> => {
  const response = await api.get<ApiResponse<PlatformSubscriptionTier[]>>(
    API_ENDPOINTS.platform.subscriptions,
  );
  return unwrap(response.data);
};
