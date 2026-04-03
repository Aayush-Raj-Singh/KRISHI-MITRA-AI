import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type {
  HierarchyNode,
  PlatformBlueprintResponse,
  PlatformSubscriptionTier,
  PlatformWorkspaceFilters,
  PlatformWorkspaceResponse,
} from "../contracts/platform";
import type { FeatureApiContext } from "./context";

export const createPlatformApi = ({ api, unwrap }: FeatureApiContext) => ({
  getBlueprint: async (): Promise<PlatformBlueprintResponse> => {
    const response = await api.get<ApiEnvelope<PlatformBlueprintResponse>>(
      API_ENDPOINTS.platform.blueprint,
    );
    return unwrap(response.data);
  },
  getWorkspace: async (filters: PlatformWorkspaceFilters): Promise<PlatformWorkspaceResponse> => {
    const response = await api.get<ApiEnvelope<PlatformWorkspaceResponse>>(
      API_ENDPOINTS.platform.workspace,
      {
        params: filters,
      },
    );
    return unwrap(response.data);
  },
  getHierarchy: async (
    filters: Omit<PlatformWorkspaceFilters, "persona" | "crop">,
  ): Promise<HierarchyNode> => {
    const response = await api.get<ApiEnvelope<HierarchyNode>>(API_ENDPOINTS.platform.hierarchy, {
      params: filters,
    });
    return unwrap(response.data);
  },
  getSubscriptions: async (): Promise<PlatformSubscriptionTier[]> => {
    const response = await api.get<ApiEnvelope<PlatformSubscriptionTier[]>>(
      API_ENDPOINTS.platform.subscriptions,
    );
    return unwrap(response.data);
  },
});
