import api, { ApiResponse, unwrap } from "./api";

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

export interface PriceArrivalDashboard {
  filters: PriceArrivalFilters;
  summary: PriceArrivalSummary;
  series: PriceArrivalPoint[];
  generated_at: string;
  cached?: boolean;
}

export const fetchPriceArrivalDashboard = async (filters: PriceArrivalFilters): Promise<PriceArrivalDashboard> => {
  const response = await api.get<ApiResponse<PriceArrivalDashboard>>("/dashboard/price-arrival", { params: filters });
  return unwrap(response.data);
};
