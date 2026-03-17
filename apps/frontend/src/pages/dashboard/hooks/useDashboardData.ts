import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  downloadAnalyticsReport,
  fetchRegionalInsights,
  type AnalyticsFilters,
  type AnalyticsReportFormat,
  type AnalyticsOverview,
  type FarmerAttentionItem,
  type FeedbackReliabilityStats
} from "../../../services/analytics";
import {
  fetchMandiCatalog,
  fetchMandiPrices,
  type MandiCatalogResponse,
  type MandiPriceResponse
} from "../../../services/integrations";
import {
  fetchSchedulerOverview,
  triggerDailyDataRefresh,
  triggerQuarterlyRetrain,
  triggerWeeklyPriceRefresh,
  type SchedulerOverviewResponse
} from "../../../services/operations";
import { FALLBACK_MANDI_CATALOG } from "../constants";
import { useLocationContext } from "../../../context/LocationContext";
import { mandiMarketLookup } from "../../../data/mandiMarketGeo";
import { haversineKm } from "../../../utils/geo";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface AnalyticsFiltersFormState {
  location: string;
  crop: string;
  farm_size_min: string;
  farm_size_max: string;
  from_date: string;
  to_date: string;
}

interface NearestMarket {
  name: string;
  distanceKm: number;
}

interface MandiPriceCard {
  crop: string;
  market: string;
  min: number;
  max: number;
  modal: number;
  changePct: number;
  distanceKm?: number;
}

const buildAnalyticsFilters = (analyticsFilters: AnalyticsFiltersFormState): AnalyticsFilters => ({
  location: analyticsFilters.location || undefined,
  crop: analyticsFilters.crop || undefined,
  farm_size_min: analyticsFilters.farm_size_min ? Number(analyticsFilters.farm_size_min) : undefined,
  farm_size_max: analyticsFilters.farm_size_max ? Number(analyticsFilters.farm_size_max) : undefined,
  from_date: analyticsFilters.from_date || undefined,
  to_date: analyticsFilters.to_date || undefined
});

const buildModalPrice = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const buildMandiCard = (result: MandiPriceResponse, distanceKm?: number): MandiPriceCard => {
  const values = result.prices.map((item) => item.price);
  const latest = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? latest;
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const changePct = previous === 0 ? 0 : ((latest - previous) / previous) * 100;
  return {
    crop: result.crop,
    market: result.market,
    min,
    max,
    modal: buildModalPrice(values),
    changePct,
    distanceKm
  };
};

interface UseDashboardDataOptions {
  isOfficer: boolean;
  isAdmin: boolean;
  t: Translate;
}

const useDashboardData = ({ isOfficer, isAdmin, t }: UseDashboardDataOptions) => {
  const { coords, label: locationLabel } = useLocationContext();
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFiltersFormState>({
    location: "",
    crop: "",
    farm_size_min: "",
    farm_size_max: "",
    from_date: "",
    to_date: ""
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [farmersNeedingAttention, setFarmersNeedingAttention] = useState<FarmerAttentionItem[]>([]);
  const [feedbackReliability, setFeedbackReliability] = useState<FeedbackReliabilityStats | null>(null);
  const [operationsOverview, setOperationsOverview] = useState<SchedulerOverviewResponse | null>(null);
  const [mandiForm, setMandiForm] = useState({
    crop: "Rice",
    market: "Patna",
    days: 7
  });
  const [mandiCategory, setMandiCategory] = useState("all");
  const [mandiCatalogData, setMandiCatalogData] = useState<MandiCatalogResponse>(FALLBACK_MANDI_CATALOG);
  const [mandiResult, setMandiResult] = useState<MandiPriceResponse | null>(null);
  const [showMandiTable, setShowMandiTable] = useState(false);
  const [nearestMarkets, setNearestMarkets] = useState<NearestMarket[]>([]);
  const [mandiCards, setMandiCards] = useState<MandiPriceCard[]>([]);
  const [hasDefaultMarket, setHasDefaultMarket] = useState(false);
  const [hasLoadedOfficerAnalytics, setHasLoadedOfficerAnalytics] = useState(false);

  const analyticsMutation = useMutation({
    mutationFn: fetchRegionalInsights,
    onSuccess: (data) => {
      setAnalyticsData(data.overview);
      setFarmersNeedingAttention(data.farmers_needing_attention);
      setFeedbackReliability(data.feedback_reliability);
    }
  });
  const reportExportMutation = useMutation({
    mutationFn: ({ format, filters }: { format: AnalyticsReportFormat; filters: AnalyticsFilters }) =>
      downloadAnalyticsReport(filters, format)
  });
  const operationsOverviewMutation = useMutation({
    mutationFn: fetchSchedulerOverview,
    onSuccess: (data) => {
      setOperationsOverview(data);
    }
  });
  const triggerWeeklyMutation = useMutation({
    mutationFn: (asyncMode: boolean) => triggerWeeklyPriceRefresh(asyncMode),
    onSuccess: () => {
      operationsOverviewMutation.mutate();
    }
  });
  const triggerQuarterlyMutation = useMutation({
    mutationFn: (asyncMode: boolean) => triggerQuarterlyRetrain(asyncMode),
    onSuccess: () => {
      operationsOverviewMutation.mutate();
    }
  });
  const triggerDailyDataMutation = useMutation({
    mutationFn: (asyncMode: boolean) => triggerDailyDataRefresh(asyncMode),
    onSuccess: () => {
      operationsOverviewMutation.mutate();
    }
  });

  const mandiMutation = useMutation({
    mutationFn: fetchMandiPrices,
    onSuccess: (data) => {
      setMandiResult(data);
    }
  });

  const analyticsChartData = useMemo(() => {
    if (!analyticsData || analyticsData.top_crops.length === 0) return null;
    return {
      labels: analyticsData.top_crops.map((item) => item.crop),
      datasets: [
        {
          label: t("dashboard_page.analytics.top_crops"),
          data: analyticsData.top_crops.map((item) => item.count),
          backgroundColor: ["#1b6b3a", "#8c2f1b", "#4b915c", "#b65d2a", "#144a2c", "#c08a4b"]
        }
      ]
    };
  }, [analyticsData, t]);

  const mandiChartData = useMemo(() => {
    if (!mandiResult) return null;
    return {
      labels: mandiResult.prices.map((item) => item.date),
      datasets: [
        {
          label: t("dashboard_page.mandi.price_label"),
          data: mandiResult.prices.map((item) => item.price),
          borderColor: "#8c2f1b",
          backgroundColor: "rgba(140, 47, 27, 0.18)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    };
  }, [mandiResult, t]);

  const mandiSummary = useMemo(() => {
    if (!mandiResult || mandiResult.prices.length === 0) return null;
    const values = mandiResult.prices.map((item) => item.price);
    const latest = values[values.length - 1];
    const previous = values[values.length - 2] ?? latest;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const changePct = previous === 0 ? 0 : ((latest - previous) / previous) * 100;
    return { latest, min, max, changePct };
  }, [mandiResult]);

  const mandiRowsWithChange = useMemo(() => {
    if (!mandiResult) return [];
    return mandiResult.prices.map((item, index, all) => {
      const previous = index > 0 ? all[index - 1].price : item.price;
      const delta = item.price - previous;
      return {
        ...item,
        delta
      };
    });
  }, [mandiResult]);

  const mandiCategoryOptions = useMemo(() => {
    const categories = new Set(mandiCatalogData.crops.map((item) => item.category));
    return ["all", ...Array.from(categories)];
  }, [mandiCatalogData.crops]);

  const filteredMandiCrops = useMemo(() => {
    return mandiCatalogData.crops
      .filter((item) => mandiCategory === "all" || item.category === mandiCategory)
      .map((item) => item.crop);
  }, [mandiCatalogData.crops, mandiCategory]);
  const mandiMarkets = mandiCatalogData.markets;

  useEffect(() => {
    if (!coords || mandiMarkets.length === 0) {
      setNearestMarkets([]);
      return;
    }
    const origin = { lat: coords.lat, lon: coords.lon };
    const nearest = mandiMarkets
      .map((market) => {
        const geo = mandiMarketLookup.get(market.toLowerCase());
        if (!geo) return null;
        return { name: market, distanceKm: haversineKm(origin, { lat: geo.lat, lon: geo.lon }) };
      })
      .filter((item): item is NearestMarket => Boolean(item))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
    setNearestMarkets(nearest);
  }, [coords, mandiMarkets]);

  useEffect(() => {
    if (!hasDefaultMarket && nearestMarkets.length) {
      setMandiForm((prev) => ({ ...prev, market: nearestMarkets[0].name }));
      setHasDefaultMarket(true);
    }
  }, [hasDefaultMarket, nearestMarkets]);

  useEffect(() => {
    let active = true;
    const loadCards = async () => {
      if (!nearestMarkets.length || !mandiForm.crop) {
        setMandiCards([]);
        return;
      }
      try {
        const results = await Promise.all(
          nearestMarkets.map((market) =>
            fetchMandiPrices({
              crop: mandiForm.crop.trim(),
              market: market.name.trim(),
              days: mandiForm.days
            })
          )
        );
        if (!active) return;
        const cards = results.map((result, index) => buildMandiCard(result, nearestMarkets[index]?.distanceKm));
        setMandiCards(cards);
      } catch {
        if (active) {
          setMandiCards([]);
        }
      }
    };
    void loadCards();
    return () => {
      active = false;
    };
  }, [nearestMarkets, mandiForm.crop, mandiForm.days]);

  useEffect(() => {
    let active = true;
    const loadMandiCatalog = async () => {
      try {
        const catalog = await fetchMandiCatalog({ limit: 1500 });
        if (!active) return;
        if (catalog.crops.length > 0) {
          setMandiCatalogData(catalog);
        }
      } catch {
        if (active) {
          setMandiCatalogData(FALLBACK_MANDI_CATALOG);
        }
      }
    };
    void loadMandiCatalog();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (filteredMandiCrops.length === 0) return;
    if (!filteredMandiCrops.some((crop) => crop.toLowerCase() === mandiForm.crop.toLowerCase())) {
      setMandiForm((prev) => ({ ...prev, crop: filteredMandiCrops[0] }));
    }
  }, [filteredMandiCrops, mandiForm.crop]);

  useEffect(() => {
    if (!isAdmin) {
      setOperationsOverview(null);
      return;
    }
    operationsOverviewMutation.mutate();
  }, [isAdmin]);

  useEffect(() => {
    if (!isOfficer || hasLoadedOfficerAnalytics) {
      return;
    }
    setHasLoadedOfficerAnalytics(true);
    analyticsMutation.mutate(buildAnalyticsFilters(analyticsFilters));
  }, [analyticsFilters, analyticsMutation, hasLoadedOfficerAnalytics, isOfficer]);

  const handleAnalyticsFetch = () => {
    analyticsMutation.mutate(buildAnalyticsFilters(analyticsFilters));
  };

  const handleAnalyticsExport = (format: AnalyticsReportFormat) => {
    reportExportMutation.mutate({ format, filters: buildAnalyticsFilters(analyticsFilters) });
  };

  const combinedError =
    analyticsMutation.error ||
    reportExportMutation.error ||
    operationsOverviewMutation.error ||
    triggerWeeklyMutation.error ||
    triggerQuarterlyMutation.error ||
    triggerDailyDataMutation.error ||
    mandiMutation.error;
  const errorMessage = combinedError instanceof Error ? combinedError.message : null;

  return {
    analyticsFilters,
    setAnalyticsFilters,
    analyticsData,
    farmersNeedingAttention,
    feedbackReliability,
    operationsOverview,
    mandiForm,
    setMandiForm,
    mandiCategory,
    setMandiCategory,
    mandiCatalogData,
    mandiResult,
    showMandiTable,
    setShowMandiTable,
    nearestMarkets,
    mandiCards,
    locationLabel,
    analyticsMutation,
    reportExportMutation,
    operationsOverviewMutation,
    triggerWeeklyMutation,
    triggerQuarterlyMutation,
    triggerDailyDataMutation,
    mandiMutation,
    analyticsChartData,
    mandiChartData,
    mandiSummary,
    mandiRowsWithChange,
    mandiCategoryOptions,
    filteredMandiCrops,
    mandiMarkets,
    handleAnalyticsFetch,
    handleAnalyticsExport,
    errorMessage
  };
};

export default useDashboardData;
