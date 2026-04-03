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

export interface RegionalInsightsResponse {
  overview: AnalyticsOverview;
  farmers_needing_attention: FarmerAttentionItem[];
  feedback_reliability: FeedbackReliabilityStats;
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

export type AnalyticsReportFormat = "pdf" | "xlsx";

export const fetchAnalyticsOverview = async (
  filters: AnalyticsFilters,
): Promise<AnalyticsOverview> => {
  const response = await api.get<ApiResponse<AnalyticsOverview>>("/analytics/overview", {
    params: filters,
  });
  return unwrap(response.data);
};

export const fetchFarmersNeedingAttention = async (params?: {
  location?: string;
  consent_safe?: boolean;
  limit?: number;
}): Promise<FarmerAttentionItem[]> => {
  const response = await api.get<ApiResponse<FarmerAttentionItem[]>>(
    "/analytics/farmers-needing-attention",
    {
      params,
    },
  );
  return unwrap(response.data);
};

export const fetchFeedbackReliability = async (params?: {
  location?: string;
}): Promise<FeedbackReliabilityStats> => {
  const response = await api.get<ApiResponse<FeedbackReliabilityStats>>(
    "/analytics/feedback-reliability",
    {
      params,
    },
  );
  return unwrap(response.data);
};

export const fetchRegionalInsights = async (
  filters: AnalyticsFilters,
): Promise<RegionalInsightsResponse> => {
  const response = await api.get<ApiResponse<RegionalInsightsResponse>>(
    "/dashboard/regional-insights",
    {
      params: { ...filters, consent_safe: true, limit: 8 },
    },
  );
  return unwrap(response.data);
};

const extractFilename = (headerValue?: string, fallback = "regional-insights-report") => {
  if (!headerValue) return fallback;
  const utfMatch = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1]);
  }
  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || fallback;
};

export const downloadAnalyticsReport = async (
  filters: AnalyticsFilters,
  format: AnalyticsReportFormat,
): Promise<{ filename: string }> => {
  const response = await api.get<Blob>("/analytics/export", {
    params: { ...filters, format, consent_safe: true, limit: 20 },
    responseType: "blob",
  });
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const filename = extractFilename(
    response.headers.get("content-disposition") || undefined,
    `regional-insights.${format}`,
  );

  if (typeof window !== "undefined") {
    const blob = new Blob([response.data], { type: contentType });
    const downloadUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  return { filename };
};

export interface PriceAccuracyItem {
  crop: string;
  market: string;
  recommendation_id: string;
  horizon_days: number;
  points: number;
  coverage_pct: number;
  mape: number;
  mae: number;
  model_version?: string;
  forecast_created_at?: string;
  actuals_from?: string;
  actuals_to?: string;
  updated_at: string;
}

export const fetchPriceAccuracy = async (params?: {
  crop?: string;
  market?: string;
  limit?: number;
}) => {
  const response = await api.get<ApiResponse<PriceAccuracyItem[]>>("/analytics/price-accuracy", {
    params,
  });
  return unwrap(response.data);
};
