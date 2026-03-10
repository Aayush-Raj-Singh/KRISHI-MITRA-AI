import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  downloadAnalyticsReport,
  fetchAnalyticsOverview,
  fetchFeedbackReliability,
  fetchFarmersNeedingAttention,
  type AnalyticsFilters,
  type AnalyticsOverview,
  type FarmerAttentionItem,
  type FeedbackReliabilityStats
} from "../../../services/analytics";
import {
  fetchMandiCatalog,
  fetchMandiPrices,
  fetchWeather,
  type MandiCatalogResponse,
  type MandiPriceResponse,
  type WeatherResponse
} from "../../../services/integrations";
import {
  fetchSchedulerOverview,
  triggerDailyDataRefresh,
  triggerQuarterlyRetrain,
  triggerWeeklyPriceRefresh,
  type SchedulerOverviewResponse
} from "../../../services/operations";
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

const buildAnalyticsFilters = (analyticsFilters: AnalyticsFiltersFormState): AnalyticsFilters => ({
  location: analyticsFilters.location || undefined,
  crop: analyticsFilters.crop || undefined,
  farm_size_min: analyticsFilters.farm_size_min ? Number(analyticsFilters.farm_size_min) : undefined,
  farm_size_max: analyticsFilters.farm_size_max ? Number(analyticsFilters.farm_size_max) : undefined,
  from_date: analyticsFilters.from_date || undefined,
  to_date: analyticsFilters.to_date || undefined
});

interface UseDashboardDataOptions {
  isAdmin: boolean;
  t: Translate;
}

const useDashboardData = ({ isAdmin, t }: UseDashboardDataOptions) => {
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
  const [weatherLocation, setWeatherLocation] = useState("Patna");
  const [weatherDays, setWeatherDays] = useState(5);
  const [weatherResult, setWeatherResult] = useState<WeatherResponse | null>(null);
  const [weatherView, setWeatherView] = useState<"table" | "chart">("table");
  const [mandiForm, setMandiForm] = useState({
    crop: "Rice",
    market: "Patna",
    days: 7
  });
  const [mandiCategory, setMandiCategory] = useState("all");
  const [mandiCatalogData, setMandiCatalogData] = useState<MandiCatalogResponse>(FALLBACK_MANDI_CATALOG);
  const [mandiResult, setMandiResult] = useState<MandiPriceResponse | null>(null);
  const [showMandiTable, setShowMandiTable] = useState(false);

  const analyticsMutation = useMutation({
    mutationFn: fetchAnalyticsOverview,
    onSuccess: (data) => {
      setAnalyticsData(data);
    }
  });
  const attentionMutation = useMutation({
    mutationFn: fetchFarmersNeedingAttention,
    onSuccess: (data) => {
      setFarmersNeedingAttention(data);
    }
  });
  const feedbackReliabilityMutation = useMutation({
    mutationFn: fetchFeedbackReliability,
    onSuccess: (data) => {
      setFeedbackReliability(data);
    }
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

  const weatherMutation = useMutation({
    mutationFn: fetchWeather,
    onSuccess: (data) => {
      setWeatherResult(data);
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

  const weatherChartData = useMemo(() => {
    if (!weatherResult) return null;
    return {
      labels: weatherResult.forecast.map((item) => item.date),
      datasets: [
        {
          label: t("dashboard_page.tables.rainfall_mm"),
          data: weatherResult.forecast.map((item) => item.rainfall_mm),
          backgroundColor: "rgba(27, 107, 58, 0.15)",
          borderColor: "rgba(27, 107, 58, 0.8)",
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 4,
          tension: 0.35,
          yAxisID: "y"
        },
        {
          label: t("dashboard_page.tables.temp_c"),
          data: weatherResult.forecast.map((item) => item.temperature_c),
          borderColor: "#b65d2a",
          backgroundColor: "rgba(182, 93, 42, 0.15)",
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.35,
          yAxisID: "y1"
        }
      ]
    };
  }, [weatherResult, t]);

  const weatherSummary = useMemo(() => {
    if (!weatherResult || weatherResult.forecast.length === 0) return null;
    const rainValues = weatherResult.forecast.map((day) => day.rainfall_mm);
    const tempValues = weatherResult.forecast.map((day) => day.temperature_c);
    const avgRain = rainValues.reduce((acc, value) => acc + value, 0) / rainValues.length;
    const avgTemp = tempValues.reduce((acc, value) => acc + value, 0) / tempValues.length;
    return {
      avgRain,
      avgTemp,
      maxTemp: Math.max(...tempValues),
      minTemp: Math.min(...tempValues)
    };
  }, [weatherResult]);

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

  const handleAnalyticsFetch = () => {
    const filters = buildAnalyticsFilters(analyticsFilters);
    analyticsMutation.mutate(filters);
    attentionMutation.mutate({ location: filters.location, consent_safe: true, limit: 8 });
    feedbackReliabilityMutation.mutate({ location: filters.location });
  };

  const handleAnalyticsDownload = async (format: "pdf" | "xlsx") => {
    const blob = await downloadAnalyticsReport(buildAnalyticsFilters(analyticsFilters), format);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `krishimitra-analytics.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const combinedError =
    analyticsMutation.error ||
    attentionMutation.error ||
    feedbackReliabilityMutation.error ||
    operationsOverviewMutation.error ||
    triggerWeeklyMutation.error ||
    triggerQuarterlyMutation.error ||
    triggerDailyDataMutation.error ||
    weatherMutation.error ||
    mandiMutation.error;
  const errorMessage = combinedError instanceof Error ? combinedError.message : null;

  return {
    analyticsFilters,
    setAnalyticsFilters,
    analyticsData,
    farmersNeedingAttention,
    feedbackReliability,
    operationsOverview,
    weatherLocation,
    setWeatherLocation,
    weatherDays,
    setWeatherDays,
    weatherResult,
    weatherView,
    setWeatherView,
    mandiForm,
    setMandiForm,
    mandiCategory,
    setMandiCategory,
    mandiCatalogData,
    mandiResult,
    showMandiTable,
    setShowMandiTable,
    analyticsMutation,
    attentionMutation,
    feedbackReliabilityMutation,
    operationsOverviewMutation,
    triggerWeeklyMutation,
    triggerQuarterlyMutation,
    triggerDailyDataMutation,
    weatherMutation,
    mandiMutation,
    analyticsChartData,
    weatherChartData,
    weatherSummary,
    mandiChartData,
    mandiSummary,
    mandiRowsWithChange,
    mandiCategoryOptions,
    filteredMandiCrops,
    handleAnalyticsFetch,
    handleAnalyticsDownload,
    errorMessage
  };
};

export default useDashboardData;
