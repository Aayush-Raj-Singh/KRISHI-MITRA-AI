export interface PriceArrivalFilters {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  date_from?: string;
  date_to?: string;
}

export interface PriceArrivalPoint {
  date: string;
  avg_price: number;
  modal_price: number;
  min_price: number;
  max_price: number;
  price_spread: number;
  arrivals_qtl: number;
  records: number;
}

export interface PriceArrivalSummary {
  average_price: number;
  modal_price: number;
  min_price: number;
  max_price: number;
  price_spread: number;
  total_arrivals_qtl: number;
  total_records: number;
}

export interface PriceArrivalDashboardResponse {
  filters: PriceArrivalFilters;
  summary: PriceArrivalSummary;
  series: PriceArrivalPoint[];
  generated_at: string;
  cached?: boolean;
}

export interface MarketPriceTableFilters {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface MarketPriceTableRow {
  district?: string | null;
  market: string;
  date: string;
  commodity: string;
  variety?: string | null;
  price: number;
  min_price: number;
  max_price: number;
}

export interface MarketPriceTableResponse {
  filters: MarketPriceTableFilters;
  items: MarketPriceTableRow[];
  total: number;
  page: number;
  page_size: number;
  generated_at: string;
  cached?: boolean;
}

export interface DashboardHeroSummary {
  latest_recommendation_id?: string | null;
  latest_recommendation_kind?: string | null;
  latest_recommendation_context?: string | null;
  latest_recommendation_created_at?: string | null;
  total_recommendations: number;
  water_recommendation_count: number;
  latest_water_savings_percent?: number | null;
  latest_water_crop?: string | null;
  latest_water_created_at?: string | null;
  latest_sustainability_score?: number | null;
  latest_sustainability_trend?: string | null;
  latest_feedback_created_at?: string | null;
  total_feedback: number;
}
