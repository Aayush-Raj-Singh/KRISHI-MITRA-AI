import api, { ApiResponse, unwrap } from "./api";

export interface CropDistributionItem {
  crop: string;
  count: number;
  percentage: number;
}

export interface AnalyticsOverview {
  total_farmers: number;
  total_feedback: number;
  average_sustainability: number;
  average_yield_kg_per_acre: number;
  average_water_usage_l_per_acre: number;
  average_fertilizer_kg_per_acre: number;
  at_risk_farmers: number;
  top_crops: CropDistributionItem[];
  generated_at: string;
  filters?: Record<string, string | number | null>;
}

export interface FarmerAttentionItem {
  user_id: string;
  name: string;
  location: string;
  sustainability_score: number;
  yield_trend_percent: number;
  average_rating: number;
  risk_score: number;
  reasons: string[];
  is_masked?: boolean;
  consent_granted?: boolean;
}

export interface FeedbackReliabilityStats {
  total_feedback: number;
  average_rating: number;
  negative_outcome_rate: number;
  rating_distribution: Record<string, number>;
  expert_review_pending: number;
  generated_at: string;
}

export interface AnalyticsFilters {
  location?: string;
  crop?: string;
  farm_size_min?: number;
  farm_size_max?: number;
  from_date?: string;
  to_date?: string;
}

export const fetchAnalyticsOverview = async (filters: AnalyticsFilters): Promise<AnalyticsOverview> => {
  const response = await api.get<ApiResponse<AnalyticsOverview>>("/analytics/overview", { params: filters });
  return unwrap(response.data);
};

export const downloadAnalyticsReport = async (filters: AnalyticsFilters, format: "pdf" | "xlsx") => {
  const response = await api.get(`/analytics/export`, {
    params: { ...filters, format },
    responseType: "blob"
  });
  return response.data as Blob;
};

export const fetchFarmersNeedingAttention = async (params?: {
  location?: string;
  consent_safe?: boolean;
  limit?: number;
}): Promise<FarmerAttentionItem[]> => {
  const response = await api.get<ApiResponse<FarmerAttentionItem[]>>("/analytics/farmers-needing-attention", {
    params
  });
  return unwrap(response.data);
};

export const fetchFeedbackReliability = async (params?: {
  location?: string;
}): Promise<FeedbackReliabilityStats> => {
  const response = await api.get<ApiResponse<FeedbackReliabilityStats>>("/analytics/feedback-reliability", {
    params
  });
  return unwrap(response.data);
};
