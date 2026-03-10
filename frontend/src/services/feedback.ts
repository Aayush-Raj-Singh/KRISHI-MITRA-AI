import api, { ApiResponse, unwrap, queueOfflineRequest } from "./api";

export interface OutcomeFeedbackRequest {
  recommendation_id: string;
  rating: number;
  yield_kg_per_acre: number;
  income_inr: number;
  water_usage_l_per_acre: number;
  fertilizer_kg_per_acre: number;
  notes?: string;
  season?: string;
}

export interface SustainabilityScores {
  water_efficiency: number;
  fertilizer_efficiency: number;
  yield_optimization: number;
}

export interface OutcomeFeedbackResponse {
  feedback_id: string;
  sustainability_score: number;
  sub_scores: SustainabilityScores;
  recommendations: string[];
  recognition_badge?: string | null;
  trend?: string | null;
  regional_comparison?: Record<string, number> | null;
  queued_for_expert_review?: boolean;
  retrain_triggered?: boolean;
  created_at: string;
}

export interface QuickFeedbackRequest {
  recommendation_id?: string;
  rating: number;
  service: "crop" | "price" | "water" | "advisory";
  notes?: string;
  source?: string;
}

export interface QuickFeedbackResponse {
  feedback_id: string;
  recommendation_id?: string | null;
  rating: number;
  service: string;
  notes?: string | null;
  created_at: string;
}

export const submitOutcomeFeedback = async (
  payload: OutcomeFeedbackRequest
): Promise<OutcomeFeedbackResponse> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineRequest("/feedback/outcome", payload);
    return {
      feedback_id: "queued",
      sustainability_score: 0,
      sub_scores: {
        water_efficiency: 0,
        fertilizer_efficiency: 0,
        yield_optimization: 0
      },
      recommendations: ["Feedback queued. It will sync when you are online."],
      recognition_badge: null,
      created_at: new Date().toISOString()
    };
  }
  const response = await api.post<ApiResponse<OutcomeFeedbackResponse>>(
    "/feedback/outcome",
    payload
  );
  return unwrap(response.data);
};

export const submitQuickFeedback = async (
  payload: QuickFeedbackRequest
): Promise<QuickFeedbackResponse> => {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueOfflineRequest("/feedback/quick", payload);
    return {
      feedback_id: "queued",
      recommendation_id: payload.recommendation_id,
      rating: payload.rating,
      service: payload.service,
      notes: payload.notes,
      created_at: new Date().toISOString()
    };
  }
  const response = await api.post<ApiResponse<QuickFeedbackResponse>>("/feedback/quick", payload);
  return unwrap(response.data);
};
