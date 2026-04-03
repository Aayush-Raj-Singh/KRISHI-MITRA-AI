import { API_ENDPOINTS } from "../constants/endpoints";
import type { CropAdvisorRequest, CropAdvisorResponse } from "../contracts/aiAdvisor";
import { sanitizeCropAdvisorPayload } from "../validators/aiAdvisor";
import type { HttpClient } from "../client/createKrishiMitraApi";

export const createAiAdvisorApi = ({ api }: { api: HttpClient }) => ({
  getAdvice: async (payload: CropAdvisorRequest): Promise<CropAdvisorResponse> => {
    const response = await api.post<CropAdvisorResponse>(
      API_ENDPOINTS.ai.advisor,
      sanitizeCropAdvisorPayload(payload),
    );
    return response.data;
  },
});
