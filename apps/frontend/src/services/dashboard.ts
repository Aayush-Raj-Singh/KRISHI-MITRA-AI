import {
  createDashboardApi,
  type DashboardHeroSummary,
  type MarketPriceTableFilters,
  type MarketPriceTableResponse as MarketPriceTable,
  type PriceArrivalDashboardResponse as PriceArrivalDashboard,
  type PriceArrivalFilters,
} from "@krishimitra/shared";

import api, { unwrap } from "./api";

const dashboardApi = createDashboardApi({ api, unwrap });

export type {
  DashboardHeroSummary,
  MarketPriceTable,
  MarketPriceTableFilters,
  PriceArrivalDashboard,
  PriceArrivalFilters,
};

export const fetchPriceArrivalDashboard = async (
  filters: PriceArrivalFilters,
): Promise<PriceArrivalDashboard> => {
  return dashboardApi.getPriceArrivalDashboard(filters);
};

export const fetchMarketPriceTable = async (
  filters: MarketPriceTableFilters,
): Promise<MarketPriceTable> => {
  return dashboardApi.getMarketPriceTable(filters);
};

export const fetchDashboardHeroSummary = async (): Promise<DashboardHeroSummary> => {
  return dashboardApi.getHeroSummary();
};
