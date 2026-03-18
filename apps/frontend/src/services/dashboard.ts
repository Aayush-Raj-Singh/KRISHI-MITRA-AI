import {
  createDashboardApi,
  type DashboardHeroSummary,
  type PriceArrivalDashboardResponse as PriceArrivalDashboard,
  type PriceArrivalFilters
} from "@krishimitra/shared";

import api, { unwrap } from "./api";

const dashboardApi = createDashboardApi({ api, unwrap });

export type {
  DashboardHeroSummary,
  PriceArrivalDashboard,
  PriceArrivalFilters
};

export const fetchPriceArrivalDashboard = async (filters: PriceArrivalFilters): Promise<PriceArrivalDashboard> => {
  return dashboardApi.getPriceArrivalDashboard(filters);
};

export const fetchDashboardHeroSummary = async (): Promise<DashboardHeroSummary> => {
  return dashboardApi.getHeroSummary();
};
