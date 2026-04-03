import {
  API_ENDPOINTS,
  sanitizeOutcomeFeedbackPayload,
  sanitizeQuickFeedbackPayload,
  type OutcomeFeedbackRequest,
  type OutcomeFeedbackResponse,
  type QuickFeedbackRequest,
  type QuickFeedbackResponse,
} from "@krishimitra/shared";

import api, { ApiResponse, unwrap, queueOfflineRequest } from "./api";

export type {
  OutcomeFeedbackRequest,
  OutcomeFeedbackResponse,
  QuickFeedbackRequest,
  QuickFeedbackResponse,
} from "@krishimitra/shared";

export const submitOutcomeFeedback = async (
  payload: OutcomeFeedbackRequest,
): Promise<OutcomeFeedbackResponse> => {
  const sanitized = sanitizeOutcomeFeedbackPayload(payload);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineRequest(API_ENDPOINTS.feedback.outcome, sanitized);
    return {
      feedback_id: "queued",
      sustainability_score: 0,
      sub_scores: {
        water_efficiency: 0,
        fertilizer_efficiency: 0,
        yield_optimization: 0,
      },
      recommendations: ["Feedback queued. It will sync when you are online."],
      recognition_badge: null,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post<ApiResponse<OutcomeFeedbackResponse>>(
    API_ENDPOINTS.feedback.outcome,
    sanitized,
  );
  return unwrap(response.data);
};

export const submitQuickFeedback = async (
  payload: QuickFeedbackRequest,
): Promise<QuickFeedbackResponse> => {
  const sanitized = sanitizeQuickFeedbackPayload(payload);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineRequest(API_ENDPOINTS.feedback.quick, sanitized);
    return {
      feedback_id: "queued",
      recommendation_id: sanitized.recommendation_id,
      rating: sanitized.rating,
      service: sanitized.service,
      notes: sanitized.notes,
      created_at: new Date().toISOString(),
    };
  }
  const response = await api.post<ApiResponse<QuickFeedbackResponse>>(
    API_ENDPOINTS.feedback.quick,
    sanitized,
  );
  return unwrap(response.data);
};
