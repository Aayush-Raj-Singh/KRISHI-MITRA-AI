import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type {
  DashboardHeroSummary,
  MarketPriceTableFilters,
  MarketPriceTableResponse,
  PriceArrivalDashboardResponse,
  PriceArrivalFilters,
} from "../contracts/dashboard";
import type { FeatureApiContext } from "./context";

export const createDashboardApi = ({ api, unwrap }: FeatureApiContext) => ({
  getHeroSummary: async (): Promise<DashboardHeroSummary> => {
    const response = await api.get<ApiEnvelope<DashboardHeroSummary>>(
      API_ENDPOINTS.dashboard.heroSummary,
    );
    return unwrap(response.data);
  },
  getPriceArrivalDashboard: async (
    filters: PriceArrivalFilters,
  ): Promise<PriceArrivalDashboardResponse> => {
    const response = await api.get<ApiEnvelope<PriceArrivalDashboardResponse>>(
      API_ENDPOINTS.dashboard.priceArrival,
      { params: filters },
    );
    return unwrap(response.data);
  },
  getMarketPriceTable: async (
    filters: MarketPriceTableFilters,
  ): Promise<MarketPriceTableResponse> => {
    const response = await api.get<ApiEnvelope<MarketPriceTableResponse>>(
      API_ENDPOINTS.dashboard.marketPrices,
      { params: filters },
    );
    return unwrap(response.data);
  },
});
