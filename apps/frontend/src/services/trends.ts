import api, { ApiResponse, unwrap } from "./api";

export interface TrendFilters {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  date_from?: string;
  date_to?: string;
}

export interface TrendPoint {
  date: string;
  avg_price: number;
  arrivals_qtl: number;
}

export interface TrendWindow {
  window_days: number;
  points: TrendPoint[];
  change_pct: number;
  average_price: number;
  volatility: number;
}

export interface SeasonalComparisonItem {
  season: string;
  average_price: number;
  average_arrivals_qtl: number;
  count: number;
}

export interface PriceSpikeAlert {
  date: string;
  change_pct: number;
  change_abs: number;
  note: string;
}

export interface TrendAnalyticsResponse {
  filters: TrendFilters;
  windows: TrendWindow[];
  seasonal: SeasonalComparisonItem[];
  volatility: number;
  alerts: PriceSpikeAlert[];
  generated_at: string;
  cached?: boolean;
}

export const fetchTrendAnalytics = async (filters: TrendFilters): Promise<TrendAnalyticsResponse> => {
  const response = await api.get<ApiResponse<TrendAnalyticsResponse>>("/analytics/trends", { params: filters });
  return unwrap(response.data);
};
