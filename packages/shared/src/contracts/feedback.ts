export interface OutcomeFeedbackRequest {
  recommendation_id: string;
  rating: number;
  yield_kg_per_acre: number;
  income_inr: number;
  water_usage_l_per_acre: number;
  fertilizer_kg_per_acre: number;
  notes?: string | null;
  season?: string | null;
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
  recommendation_id?: string | null;
  rating: number;
  service: "crop" | "price" | "water" | "advisory";
  notes?: string | null;
  source?: string | null;
}

export interface QuickFeedbackResponse {
  feedback_id: string;
  recommendation_id?: string | null;
  rating: number;
  service: string;
  notes?: string | null;
  created_at: string;
}
