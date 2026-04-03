import { API_ENDPOINTS } from "../constants/endpoints";
import type {
  AdvisorySlaTelemetry,
  ChatHistoryResponse,
  ChatRequest,
  ChatResponse,
  TranslationRequest,
  TranslationResponse,
} from "../contracts/advisory";
import type { ApiEnvelope } from "../contracts/common";
import { sanitizeChatPayload, sanitizeTranslationPayload } from "../validators/advisory";
import type { FeatureApiContext } from "./context";

export const createAdvisoryApi = ({ api, unwrap }: FeatureApiContext) => ({
  sendMessage: async (payload: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ApiEnvelope<ChatResponse>>(
      API_ENDPOINTS.advisory.chat,
      sanitizeChatPayload(payload),
    );
    return unwrap(response.data);
  },
  getHistory: async (): Promise<ChatHistoryResponse> => {
    const response = await api.get<ApiEnvelope<ChatHistoryResponse>>(
      API_ENDPOINTS.advisory.history,
    );
    return unwrap(response.data);
  },
  getSlaTelemetry: async (params?: {
    window_minutes?: number;
    sla_target_ms?: number;
  }): Promise<AdvisorySlaTelemetry> => {
    const response = await api.get<ApiEnvelope<AdvisorySlaTelemetry>>(
      API_ENDPOINTS.advisory.telemetrySla,
      { params },
    );
    return unwrap(response.data);
  },
  translate: async (payload: TranslationRequest): Promise<TranslationResponse> => {
    const response = await api.post<ApiEnvelope<TranslationResponse>>(
      API_ENDPOINTS.advisory.translate,
      sanitizeTranslationPayload(payload),
    );
    return unwrap(response.data);
  },
});
