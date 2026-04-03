import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type { DiseaseHistoryItem, DiseasePredictionResponse } from "../contracts/disease";
import type { FeatureApiContext } from "./context";

export const createDiseaseApi = ({ api, unwrap }: FeatureApiContext) => ({
  predict: async (formData: FormData): Promise<DiseasePredictionResponse> => {
    const response = await api.post<ApiEnvelope<DiseasePredictionResponse>>(
      API_ENDPOINTS.disease.predict,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return unwrap(response.data);
  },
  getHistory: async (limit = 10): Promise<DiseaseHistoryItem[]> => {
    const response = await api.get<ApiEnvelope<DiseaseHistoryItem[]>>(
      API_ENDPOINTS.disease.history,
      {
        params: { limit },
      },
    );
    return unwrap(response.data);
  },
});
