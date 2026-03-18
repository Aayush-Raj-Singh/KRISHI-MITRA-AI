import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type {
  OutcomeFeedbackRequest,
  OutcomeFeedbackResponse,
  QuickFeedbackRequest,
  QuickFeedbackResponse
} from "../contracts/feedback";
import {
  sanitizeOutcomeFeedbackPayload,
  sanitizeQuickFeedbackPayload
} from "../validators/feedback";
import type { FeatureApiContext } from "./context";

export const createFeedbackApi = ({ api, unwrap }: FeatureApiContext) => ({
  submitOutcomeFeedback: async (
    payload: OutcomeFeedbackRequest
  ): Promise<OutcomeFeedbackResponse> => {
    const response = await api.post<ApiEnvelope<OutcomeFeedbackResponse>>(
      API_ENDPOINTS.feedback.outcome,
      sanitizeOutcomeFeedbackPayload(payload)
    );
    return unwrap(response.data);
  },
  submitQuickFeedback: async (payload: QuickFeedbackRequest): Promise<QuickFeedbackResponse> => {
    const response = await api.post<ApiEnvelope<QuickFeedbackResponse>>(
      API_ENDPOINTS.feedback.quick,
      sanitizeQuickFeedbackPayload(payload)
    );
    return unwrap(response.data);
  }
});
