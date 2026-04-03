import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type {
  StateCatalogResponse,
  StateIntelligenceFilters,
  StateIntelligenceResponse,
  StateResolveFilters,
  StateResolutionResponse,
} from "../contracts/stateEngine";
import type { FeatureApiContext } from "./context";

export const createStateEngineApi = ({ api, unwrap }: FeatureApiContext) => ({
  getCatalog: async (): Promise<StateCatalogResponse> => {
    const response = await api.get<ApiEnvelope<StateCatalogResponse>>(
      API_ENDPOINTS.stateEngine.catalog,
    );
    return unwrap(response.data);
  },
  resolve: async (filters: StateResolveFilters): Promise<StateResolutionResponse> => {
    const response = await api.get<ApiEnvelope<StateResolutionResponse>>(
      API_ENDPOINTS.stateEngine.resolve,
      {
        params: filters,
      },
    );
    return unwrap(response.data);
  },
  getIntelligence: async (
    filters: StateIntelligenceFilters,
  ): Promise<StateIntelligenceResponse> => {
    const response = await api.get<ApiEnvelope<StateIntelligenceResponse>>(
      API_ENDPOINTS.stateEngine.intelligence,
      {
        params: filters,
      },
    );
    return unwrap(response.data);
  },
});
