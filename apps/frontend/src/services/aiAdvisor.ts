import {
  createAiAdvisorApi,
  createKrishiMitraApi,
  type CropAdvisorRequest,
  type CropAdvisorResponse,
} from "@krishimitra/shared";

import { resolveRootBaseUrl } from "./runtimeConfig";

const resolveAiAdvisorBaseUrl = () => {
  const configuredBase =
    (import.meta.env.VITE_AI_ADVISOR_BASE_URL as string | undefined) ||
    (import.meta.env.VITE_API_BASE_URL as string | undefined);
  const normalized = resolveRootBaseUrl(configuredBase);
  return normalized.replace(/\/api\/ai\/advisor$/i, "");
};

const { api } = createKrishiMitraApi({
  baseURL: resolveAiAdvisorBaseUrl(),
  onError: () => {},
});

const aiAdvisorApi = createAiAdvisorApi({ api });

export type { CropAdvisorRequest, CropAdvisorResponse };

export const fetchAiAdvisorAdvice = async (
  payload: CropAdvisorRequest,
): Promise<CropAdvisorResponse> => {
  return aiAdvisorApi.getAdvice(payload);
};
