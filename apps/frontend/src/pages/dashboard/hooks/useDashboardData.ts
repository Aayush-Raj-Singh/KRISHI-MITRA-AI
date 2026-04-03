import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  downloadAnalyticsReport,
  fetchRegionalInsights,
  type AnalyticsFilters,
  type AnalyticsOverview,
  type AnalyticsReportFormat,
  type FarmerAttentionItem,
  type FeedbackReliabilityStats,
} from "../../../services/analytics";
import { fetchDashboardHeroSummary, type DashboardHeroSummary } from "../../../services/dashboard";
import {
  fetchMandiCatalog,
  fetchMandiPrices,
  type MandiCatalogResponse,
  type MandiPriceResponse,
} from "../../../services/integrations";
import { fetchMandiDirectory } from "../../../services/mandiDirectory";
import {
  fetchSchedulerOverview,
  triggerDailyDataRefresh,
  triggerQuarterlyRetrain,
  triggerWeeklyPriceRefresh,
  type SchedulerOverviewResponse,
} from "../../../services/operations";
import { resolveWsUrl } from "../../../services/runtimeConfig";
import { useLocationContext } from "../../../context/LocationContext";
import { mandiMarketLookup } from "../../../data/mandiMarketGeo";
import {
  buildTradingSnapshotQueryKey,
  buildTradingSummary,
  fetchMandiTradingSnapshot,
  matchesRealtimeTick,
  mergeRealtimeTick,
  parseRealtimeMandiEvent,
} from "../../../features/mandi-trading/services/mandiTradingService";
import type {
  LiveTransportMode,
  MandiTradingPoint,
  MandiTradingSnapshot,
  TradingTimeframe,
} from "../../../features/mandi-trading/types";
import { useAppSelector } from "../../../store/hooks";
import { haversineKm } from "../../../utils/geo";
import { useWebSocket } from "../../../utils/useWebSocket";
import { FALLBACK_MANDI_CATALOG } from "../constants";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface AnalyticsFiltersFormState {
  location: string;
  crop: string;
  farm_size_min: string;
  farm_size_max: string;
  from_date: string;
  to_date: string;
}

interface MandiFormValues {
  crop: string;
  market: string;
  days: number;
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

const normalizeText = (value?: string | null) => String(value || "").trim();
const normalizeKey = (value?: string | null) => normalizeText(value).toLowerCase();
const sameValue = (left?: string | null, right?: string | null) =>
  normalizeKey(left) === normalizeKey(right);

const buildAnalyticsFilters = (analyticsFilters: AnalyticsFiltersFormState): AnalyticsFilters => ({
  location: analyticsFilters.location || undefined,
  crop: analyticsFilters.crop || undefined,
  farm_size_min: analyticsFilters.farm_size_min
    ? Number(analyticsFilters.farm_size_min)
    : undefined,
  farm_size_max: analyticsFilters.farm_size_max
    ? Number(analyticsFilters.farm_size_max)
    : undefined,
  from_date: analyticsFilters.from_date || undefined,
  to_date: analyticsFilters.to_date || undefined,
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
    distanceKm,
  };
};

const toTradingTimeframe = (days: number): TradingTimeframe => {
  if (days <= 1) return 1;
  if (days <= 7) return 7;
  return 30;
};

interface UseDashboardDataOptions {
  isOfficer: boolean;
  isAdmin: boolean;
  t: Translate;
}

const useDashboardData = ({ isOfficer, isAdmin, t }: UseDashboardDataOptions) => {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  const {
    coords,
    label: locationLabel,
    status: locationStatus,
    requestLocation,
  } = useLocationContext();
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsFiltersFormState>({
    location: "",
    crop: "",
    farm_size_min: "",
    farm_size_max: "",
    from_date: "",
    to_date: "",
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [farmersNeedingAttention, setFarmersNeedingAttention] = useState<FarmerAttentionItem[]>([]);
  const [feedbackReliability, setFeedbackReliability] = useState<FeedbackReliabilityStats | null>(
    null,
  );
  const [heroSummary, setHeroSummary] = useState<DashboardHeroSummary | null>(null);
  const [operationsOverview, setOperationsOverview] = useState<SchedulerOverviewResponse | null>(
    null,
  );
  const [mandiForm, setMandiForm] = useState<MandiFormValues>({
    crop: "Rice",
    market: "Patna",
    days: 30,
  });
  const [mandiCategory, setMandiCategory] = useState("all");
  const [mandiCatalogData, setMandiCatalogData] =
    useState<MandiCatalogResponse>(FALLBACK_MANDI_CATALOG);
  const [mandiResult, setMandiResult] = useState<MandiPriceResponse | null>(null);
  const [showMandiTable, setShowMandiTable] = useState(false);
  const [nearestMarkets, setNearestMarkets] = useState<NearestMarket[]>([]);
  const [mandiCards, setMandiCards] = useState<MandiPriceCard[]>([]);
  const [hasDefaultMarket, setHasDefaultMarket] = useState(false);
  const [hasLoadedOfficerAnalytics, setHasLoadedOfficerAnalytics] = useState(false);
  const [hasRealtimeMarketFeed, setHasRealtimeMarketFeed] = useState(false);

  const analyticsMutation = useMutation({
    mutationFn: fetchRegionalInsights,
    onSuccess: (data) => {
      setAnalyticsData(data.overview);
      setFarmersNeedingAttention(data.farmers_needing_attention);
      setFeedbackReliability(data.feedback_reliability);
    },
  });
  const heroSummaryMutation = useMutation({
    mutationFn: fetchDashboardHeroSummary,
    onSuccess: (data) => {
      setHeroSummary(data);
    },
  });
  const reportExportMutation = useMutation({
    mutationFn: ({
      format,
      filters,
    }: {
      format: AnalyticsReportFormat;
      filters: AnalyticsFilters;
    }) => downloadAnalyticsReport(filters, format),
  });
  const operationsOverviewMutation = useMutation({
    mutationFn: fetchSchedulerOverview,
    onSuccess: (data) => {
      setOperationsOverview(data);
    },
  });
  const triggerWeeklyMutation = useMutation({
    mutationFn: (asyncMode: boolean) => triggerWeeklyPriceRefresh(asyncMode),
    onSuccess: () => {
      operationsOverviewMutation.mutate();
    },
  });
  const triggerQuarterlyMutation = useMutation({
    mutationFn: (asyncMode: boolean) => triggerQuarterlyRetrain(asyncMode),
    onSuccess: () => {
      operationsOverviewMutation.mutate();
    },
  });
  const triggerDailyDataMutation = useMutation({
    mutationFn: (asyncMode: boolean) => triggerDailyDataRefresh(asyncMode),
    onSuccess: () => {
      operationsOverviewMutation.mutate();
    },
  });

  const mandiMutation = useMutation({
    mutationFn: fetchMandiPrices,
    onSuccess: (data) => {
      setMandiResult(data);
    },
  });

  const directoryQuery = useQuery({
    queryKey: ["dashboard-mandi-directory"],
    queryFn: () => fetchMandiDirectory({ limit: 800 }),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const mandiMarkets = mandiCatalogData.markets;
  const directoryItems = directoryQuery.data || [];
  const resolvedMandiState = useMemo(() => {
    const match = directoryItems.find((item) => sameValue(item.name, mandiForm.market));
    return match?.state || "";
  }, [directoryItems, mandiForm.market]);

  const tradingTimeframe = useMemo(() => toTradingTimeframe(mandiForm.days), [mandiForm.days]);
  const tradingFilters = useMemo(
    () => ({
      crop: normalizeText(mandiForm.crop),
      mandi: normalizeText(mandiForm.market),
      state: normalizeText(resolvedMandiState),
      timeframe: tradingTimeframe,
    }),
    [mandiForm.crop, mandiForm.market, resolvedMandiState, tradingTimeframe],
  );
  const tradingSnapshotQueryKey = useMemo(
    () => buildTradingSnapshotQueryKey(tradingFilters),
    [tradingFilters],
  );

  const wsBaseUrl = resolveWsUrl(import.meta.env.VITE_WS_URL as string | undefined);
  const wsUrl = accessToken ? wsBaseUrl : undefined;
  const wsAuthMessage = accessToken
    ? JSON.stringify({ type: "auth", token: accessToken })
    : undefined;
  const {
    status: marketFeedStatus,
    lastEvent: marketFeedEvent,
    sendMessage: sendMarketFeedMessage,
  } = useWebSocket(wsUrl, wsAuthMessage);

  const tradingSnapshotQuery = useQuery({
    queryKey: tradingSnapshotQueryKey,
    queryFn: () => fetchMandiTradingSnapshot(tradingFilters),
    enabled: Boolean(tradingFilters.crop && tradingFilters.mandi),
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchInterval: hasRealtimeMarketFeed && marketFeedStatus === "open" ? false : 8000,
  });

  useEffect(() => {
    setHasRealtimeMarketFeed(false);
  }, [
    tradingFilters.crop,
    tradingFilters.mandi,
    tradingFilters.state,
    tradingFilters.timeframe,
    marketFeedStatus,
  ]);

  useEffect(() => {
    if (marketFeedStatus !== "open") return;
    const interval = window.setInterval(() => {
      sendMarketFeedMessage("ping");
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [marketFeedStatus, sendMarketFeedMessage]);

  useEffect(() => {
    if (!marketFeedEvent) return;
    const tick = parseRealtimeMandiEvent(marketFeedEvent);
    if (!tick || !matchesRealtimeTick(tick, tradingFilters)) {
      return;
    }

    setHasRealtimeMarketFeed(true);
    queryClient.setQueryData<MandiTradingSnapshot>(tradingSnapshotQueryKey, (current) => {
      const nextHistory = mergeRealtimeTick(current?.history || [], tick, tradingFilters.timeframe);
      return {
        history: nextHistory,
        summary: buildTradingSummary(nextHistory, tick.timestamp),
        gainers: current?.gainers || [],
        losers: current?.losers || [],
        staleDataWarning: current?.staleDataWarning || null,
        updatedAt: tick.timestamp,
        source: current?.source || "websocket",
        isCached: false,
        offline: false,
      };
    });
  }, [marketFeedEvent, queryClient, tradingFilters, tradingSnapshotQueryKey]);

  const tradingSnapshot = tradingSnapshotQuery.data || null;
  const transportMode: LiveTransportMode =
    marketFeedStatus === "open" && hasRealtimeMarketFeed ? "websocket" : "polling";
  const recentTape = useMemo<MandiTradingPoint[]>(
    () => [...(tradingSnapshot?.history || [])].slice(-6).reverse(),
    [tradingSnapshot?.history],
  );

  const analyticsChartData = useMemo(() => {
    if (!analyticsData || analyticsData.top_crops.length === 0) return null;
    return {
      labels: analyticsData.top_crops.map((item) => item.crop),
      datasets: [
        {
          label: t("dashboard_page.analytics.top_crops"),
          data: analyticsData.top_crops.map((item) => item.count),
          backgroundColor: ["#1b6b3a", "#8c2f1b", "#4b915c", "#b65d2a", "#144a2c", "#c08a4b"],
        },
      ],
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
          pointHoverRadius: 5,
        },
      ],
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
        delta,
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

  const explicitMarketHint = useMemo(() => {
    const primaryLabel = (locationLabel || "").split(",")[0]?.trim().toLowerCase();
    if (!primaryLabel) return null;
    return mandiMarkets.find((market) => market.toLowerCase() === primaryLabel) || null;
  }, [locationLabel, mandiMarkets]);

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
        return {
          name: market,
          distanceKm: haversineKm(origin, { lat: geo.lat, lon: geo.lon }),
        };
      })
      .filter((item): item is NearestMarket => Boolean(item))
      .sort((a, b) => {
        if (explicitMarketHint && a.name === explicitMarketHint) return -1;
        if (explicitMarketHint && b.name === explicitMarketHint) return 1;
        return a.distanceKm - b.distanceKm;
      })
      .slice(0, 3);
    setNearestMarkets(nearest);
  }, [coords, explicitMarketHint, mandiMarkets]);

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
              days: mandiForm.days,
            }),
          ),
        );
        if (!active) return;
        const cards = results.map((result, index) =>
          buildMandiCard(result, nearestMarkets[index]?.distanceKm),
        );
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
    const crop = mandiForm.crop.trim();
    const market = mandiForm.market.trim();
    if (!crop || !market) {
      return;
    }
    mandiMutation.mutate({ crop, market, days: mandiForm.days });
  }, [mandiForm.crop, mandiForm.market, mandiForm.days]);

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
    if (!heroSummary && !heroSummaryMutation.isPending) {
      heroSummaryMutation.mutate();
    }
  }, [heroSummary, heroSummaryMutation]);

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
    reportExportMutation.mutate({
      format,
      filters: buildAnalyticsFilters(analyticsFilters),
    });
  };

  const combinedError =
    heroSummaryMutation.error ||
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
    heroSummary,
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
    locationCoords: coords,
    locationAccuracyMeters: coords?.accuracy,
    locationStatus,
    refreshLocation: requestLocation,
    analyticsMutation,
    heroSummaryMutation,
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
    resolvedMandiState,
    tradingSnapshot,
    tradingTransportMode: transportMode,
    tradingFeedStatus: marketFeedStatus,
    tradingRecentTape: recentTape,
    tradingIsRefreshing: tradingSnapshotQuery.isFetching && Boolean(tradingSnapshot),
    tradingIsLoading: tradingSnapshotQuery.isLoading && !tradingSnapshot,
    tradingError: tradingSnapshotQuery.error || directoryQuery.error || null,
    refreshTradingSnapshot: () => tradingSnapshotQuery.refetch(),
    handleAnalyticsFetch,
    handleAnalyticsExport,
    errorMessage,
  };
};

export default useDashboardData;
