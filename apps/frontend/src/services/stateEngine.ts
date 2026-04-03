import {
  API_ENDPOINTS,
  type StateCatalogResponse,
  type StateIntelligenceFilters,
  type StateIntelligenceResponse,
  type StateResolveFilters,
  type StateResolutionResponse,
} from "@krishimitra/shared";

import api, { ApiResponse, unwrap } from "./api";
import { cachedGet } from "./apiClient";

export const fetchStateCatalog = async (): Promise<StateCatalogResponse> => {
  const result = await cachedGet<StateCatalogResponse>(
    API_ENDPOINTS.stateEngine.catalog,
    undefined,
    { store: "api", key: "state_engine:catalog", ttlMs: 1000 * 60 * 60 },
  );
  return result.data;
};

export const resolveStateContext = async (
  filters: StateResolveFilters,
): Promise<StateResolutionResponse> => {
  const response = await api.get<ApiResponse<StateResolutionResponse>>(
    API_ENDPOINTS.stateEngine.resolve,
    {
      params: filters,
    },
  );
  return unwrap(response.data);
};

export const fetchStateIntelligence = async (
  filters: StateIntelligenceFilters,
): Promise<StateIntelligenceResponse> => {
  const cacheKey = [
    "state_engine:intelligence",
    filters.state || "",
    filters.district || "",
    filters.crop || "",
    filters.lat ?? "",
    filters.lon ?? "",
  ].join(":");
  const result = await cachedGet<StateIntelligenceResponse>(
    API_ENDPOINTS.stateEngine.intelligence,
    { params: filters },
    { store: "api", key: cacheKey, ttlMs: 1000 * 60 * 5 },
  );
  return result.data;
};
