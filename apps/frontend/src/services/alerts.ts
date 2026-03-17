import api, { ApiResponse, unwrap } from "./api";

export interface MarketAlert {
  date: string;
  change_pct: number;
  change_abs: number;
  note: string;
}

export const fetchMarketAlerts = async (params?: {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
  variety?: string;
  grade?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const response = await api.get<ApiResponse<MarketAlert[]>>("/alerts/market", { params });
  return unwrap(response.data);
};
