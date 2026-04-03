import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import ExploreIcon from "@mui/icons-material/Explore";
import InsightsIcon from "@mui/icons-material/Insights";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SyncIcon from "@mui/icons-material/Sync";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Line } from "react-chartjs-2";

import type {
  MandiMover,
  MandiTradingPoint,
  MandiTradingSnapshot,
} from "../../../features/mandi-trading/types";
import type { MandiPricePoint, MandiPriceResponse } from "../../../services/integrations";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface MandiFormValues {
  crop: string;
  market: string;
  days: number;
}

type MandiPriceCard = {
  crop: string;
  market: string;
  min: number;
  max: number;
  modal: number;
  changePct: number;
  distanceKm?: number;
};

type NearestMarket = {
  name: string;
  distanceKm: number;
};

interface MarketDataSectionProps {
  t: Translate;
  mandiCategory: string;
  setMandiCategory: React.Dispatch<React.SetStateAction<string>>;
  mandiCategoryOptions: string[];
  filteredMandiCrops: string[];
  mandiForm: MandiFormValues;
  setMandiForm: React.Dispatch<React.SetStateAction<MandiFormValues>>;
  mandiMarkets: string[];
  mandiMutation: UseMutationResult<
    MandiPriceResponse,
    unknown,
    { crop: string; market: string; days: number },
    unknown
  >;
  mandiSummary: {
    latest: number;
    min: number;
    max: number;
    changePct: number;
  } | null;
  mandiResult: MandiPriceResponse | null;
  mandiChartData: ChartData<"line", number[], string> | null;
  showMandiTable: boolean;
  setShowMandiTable: React.Dispatch<React.SetStateAction<boolean>>;
  mandiRowsWithChange: Array<MandiPricePoint & { delta: number }>;
  mandiCards: MandiPriceCard[];
  nearestMarkets: NearestMarket[];
  resolvedMandiState?: string;
  tradingSnapshot: MandiTradingSnapshot | null;
  tradingTransportMode: "websocket" | "polling";
  tradingFeedStatus: string;
  tradingRecentTape: MandiTradingPoint[];
  tradingIsRefreshing: boolean;
  tradingIsLoading: boolean;
  tradingError: unknown;
  refreshTradingSnapshot: () => void;
  locationLabel?: string;
  locationCoords?: { lat: number; lon: number };
  locationAccuracyMeters?: number;
  locationStatus?: string;
  refreshLocation: () => void;
}

const sectionTitleSx = {
  fontWeight: 700,
  letterSpacing: 0.2,
} as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatCurrencyCompact = (value: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
  }).format(value);

const formatMarketDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(parsed);
};

const formatMarketDateTime = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const formatPrecisionCoords = (lat: number, lon: number) => `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

const getSignalTone = (delta: number) => {
  if (delta >= 10) return { label: "Strong rise", color: "success" as const };
  if (delta > 0) return { label: "Mild rise", color: "success" as const };
  if (delta <= -25) return { label: "Harvest pressure", color: "warning" as const };
  if (delta < 0) return { label: "Softening", color: "warning" as const };
  return { label: "Stable", color: "default" as const };
};

const buildTransportLabel = (
  t: Translate,
  tradingTransportMode: "websocket" | "polling",
  tradingFeedStatus: string,
  tradingSnapshot: MandiTradingSnapshot | null,
) => {
  if (tradingSnapshot?.offline) {
    return t("dashboard_page.mandi.transport_offline", {
      defaultValue: "Offline cached snapshot",
    });
  }
  if (tradingTransportMode === "websocket") {
    return t("dashboard_page.mandi.transport_live", {
      defaultValue: "Live WebSocket feed",
    });
  }
  if (tradingFeedStatus === "open") {
    return t("dashboard_page.mandi.transport_ready", {
      defaultValue: "WebSocket ready / polling snapshots",
    });
  }
  return t("dashboard_page.mandi.transport_polling", {
    defaultValue: "Polling market snapshots",
  });
};

const MoversCard = ({
  items,
  title,
  emptyLabel,
  positive,
  isDark,
}: {
  items: MandiMover[];
  title: string;
  emptyLabel: string;
  positive: boolean;
  isDark: boolean;
}) => (
  <Paper
    elevation={0}
    sx={{
      height: "100%",
      p: 1.7,
      borderRadius: 2.8,
      border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(28,77,44,0.08)",
      bgcolor: isDark ? "rgba(9, 28, 19, 0.72)" : "rgba(255,255,255,0.82)",
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Chip
        size="small"
        label={items.length}
        color={positive ? "success" : "warning"}
        sx={{ borderRadius: 999, fontWeight: 800 }}
      />
    </Stack>
    {items.length ? (
      <Stack spacing={1}>
        {items.map((item) => (
          <Paper
            key={`${item.crop}-${item.mandi}-${item.timestamp}`}
            elevation={0}
            sx={{
              p: 1.1,
              borderRadius: 2.2,
              border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(28,77,44,0.08)",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(243, 249, 241, 0.76)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  {item.crop}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.mandi}
                  {item.state ? `, ${item.state}` : ""}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {formatCurrency(item.currentPrice)}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: positive ? "success.main" : "warning.main",
                    fontWeight: 800,
                  }}
                >
                  {item.changePct >= 0 ? "+" : ""}
                  {item.changePct.toFixed(2)}%
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Stack>
    ) : (
      <Paper
        variant="outlined"
        sx={{
          p: 1.4,
          borderRadius: 2.2,
          borderStyle: "dashed",
          bgcolor: "transparent",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {emptyLabel}
        </Typography>
      </Paper>
    )}
  </Paper>
);

const MarketDataSection: React.FC<MarketDataSectionProps> = ({
  t,
  mandiCategory,
  setMandiCategory,
  mandiCategoryOptions,
  filteredMandiCrops,
  mandiForm,
  setMandiForm,
  mandiMarkets,
  mandiMutation,
  mandiSummary,
  mandiResult,
  mandiChartData,
  showMandiTable,
  setShowMandiTable,
  mandiRowsWithChange,
  mandiCards,
  nearestMarkets,
  resolvedMandiState,
  tradingSnapshot,
  tradingTransportMode,
  tradingFeedStatus,
  tradingRecentTape,
  tradingIsRefreshing,
  tradingIsLoading,
  tradingError,
  refreshTradingSnapshot,
  locationLabel,
  locationCoords,
  locationAccuracyMeters,
  locationStatus,
  refreshLocation,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const translateCategory = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (normalized === "all") return t("categories.all", { defaultValue: "All" });
    if (normalized === "cereals") return t("categories.cereals", { defaultValue: "Cereals" });
    if (normalized === "pulses") return t("categories.pulses", { defaultValue: "Pulses" });
    if (normalized === "oilseeds") return t("categories.oilseeds", { defaultValue: "Oilseeds" });
    if (normalized === "vegetables")
      return t("categories.vegetables", { defaultValue: "Vegetables" });
    if (normalized === "fruits") return t("categories.fruits", { defaultValue: "Fruits" });
    if (normalized === "spices") return t("categories.spices", { defaultValue: "Spices" });
    return value;
  };

  const quickFilters = [
    {
      key: "rice",
      label: t("crops.rice", { defaultValue: "Rice" }),
      crop: "Rice",
      category: "all",
    },
    {
      key: "wheat",
      label: t("crops.wheat", { defaultValue: "Wheat" }),
      crop: "Wheat",
      category: "all",
    },
    {
      key: "maize",
      label: t("crops.maize", { defaultValue: "Maize" }),
      crop: "Maize",
      category: "all",
    },
    {
      key: "pulses",
      label: t("crops.pulses", { defaultValue: "Pulses" }),
      crop: null,
      category: "pulses",
    },
    {
      key: "vegetables",
      label: t("crops.vegetables", { defaultValue: "Vegetables" }),
      crop: null,
      category: "vegetables",
    },
  ];

  const cardSx = {
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #dde6d4",
    borderRadius: 3,
    overflow: "hidden",
    boxShadow: isDark ? "0 20px 40px rgba(0, 0, 0, 0.35)" : "0 20px 40px rgba(19, 56, 32, 0.12)",
    background: isDark
      ? "linear-gradient(180deg, rgba(18, 50, 33, 0.98) 0%, rgba(14, 38, 26, 0.98) 100%)"
      : "linear-gradient(180deg, rgba(252, 255, 252, 0.98) 0%, rgba(244, 250, 243, 0.98) 100%)",
  } as const;

  const cardHeaderSx = {
    px: 2,
    py: 1.5,
    borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(28, 77, 44, 0.08)",
    background: isDark
      ? "linear-gradient(90deg, rgba(24, 66, 43, 0.8), rgba(12, 34, 24, 0.75))"
      : "linear-gradient(90deg, rgba(223, 240, 221, 0.7), rgba(247, 252, 247, 0.6))",
  } as const;

  const chipPillSx = {
    borderRadius: 999,
    fontWeight: 700,
    bgcolor: isDark ? "rgba(122, 194, 140, 0.16)" : "rgba(27, 107, 58, 0.08)",
    color: isDark ? "#cfead4" : "#1b6b3a",
    border: isDark ? "1px solid rgba(122, 194, 140, 0.28)" : "1px solid transparent",
  } as const;

  const locationPrecisionLabel =
    typeof locationAccuracyMeters === "number"
      ? `GPS ±${Math.max(1, Math.round(locationAccuracyMeters))}m`
      : t("dashboard_page.mandi.gps_pending", { defaultValue: "GPS syncing" });
  const coordinateLabel = locationCoords
    ? formatPrecisionCoords(locationCoords.lat, locationCoords.lon)
    : null;
  const isLocating = locationStatus === "locating";
  const selectedScope = resolvedMandiState
    ? `${mandiForm.market}, ${resolvedMandiState}`
    : mandiForm.market;
  const transportLabel = buildTransportLabel(
    t,
    tradingTransportMode,
    tradingFeedStatus,
    tradingSnapshot,
  );
  const liveSummary = tradingSnapshot?.summary;
  const effectiveSummary = liveSummary
    ? {
        latest: liveSummary.currentPrice,
        min: liveSummary.lowPrice,
        max: liveSummary.highPrice,
        changePct: liveSummary.changePct,
      }
    : mandiSummary;
  const previousPrint = liveSummary?.previousPrice ?? effectiveSummary?.latest ?? 0;
  const sourceLabel = tradingSnapshot?.source
    ? tradingSnapshot.source.replace(/[_-]/g, " ")
    : mandiResult?.source ||
      t("dashboard_page.mandi.market_snapshot", {
        defaultValue: "Market snapshot",
      });
  const lastSyncLabel =
    formatMarketDateTime(
      tradingSnapshot?.updatedAt || mandiResult?.last_updated || mandiResult?.fetched_at,
    ) || t("dashboard_page.mandi.awaiting_sync", { defaultValue: "Awaiting sync" });
  const staleWarning = tradingSnapshot?.staleDataWarning || mandiResult?.stale_data_warning || null;
  const preciseLocationLabel = locationPrecisionLabel;

  const enhancedMandiChartData = React.useMemo<ChartData<"line", number[], string> | null>(() => {
    if (!mandiChartData) return null;
    return {
      ...mandiChartData,
      labels: mandiChartData.labels?.map((label) => formatMarketDate(String(label))) ?? [],
      datasets: mandiChartData.datasets.map((dataset) => ({
        ...dataset,
        borderColor: isDark ? "#d58d46" : "#8c2f1b",
        backgroundColor: alpha(isDark ? "#8ebf72" : "#5d8a31", isDark ? 0.2 : 0.14),
        borderWidth: 4,
        fill: true,
        tension: 0.38,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        pointBackgroundColor: isDark ? "#fff4d6" : "#fff9ef",
        pointBorderColor: isDark ? "#d58d46" : "#8c2f1b",
      })),
    };
  }, [isDark, mandiChartData]);

  const chartOptions = React.useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: "index",
          intersect: false,
          backgroundColor: alpha("#102116", 0.92),
          titleColor: "#f4f8ef",
          bodyColor: "#f4f8ef",
          borderColor: alpha("#c9ddb2", 0.4),
          borderWidth: 1,
          padding: 12,
          callbacks: {
            title: (items) => items[0]?.label ?? "",
            label: (context) =>
              `${t("dashboard_page.mandi.price_label", { defaultValue: "Price" })}: ${formatCurrency(Number(context.parsed.y || 0))}`,
            afterBody: () => [
              `${t("dashboard_page.forms.market", { defaultValue: "Market" })}: ${mandiForm.market}`,
              `${t("dashboard_page.mandi.state_label", { defaultValue: "State" })}: ${
                resolvedMandiState || t("actions.na", { defaultValue: "N/A" })
              }`,
            ],
          },
        },
      },
      interaction: { mode: "nearest", intersect: false },
      scales: {
        x: {
          title: {
            display: true,
            text: t("dashboard_page.tables.date", { defaultValue: "Date" }),
            color: isDark ? "#eef7e8" : "#20492e",
            font: { weight: 700 },
          },
          ticks: {
            color: isDark ? "#eef7e8" : "#355740",
            maxRotation: 0,
            autoSkipPadding: 18,
          },
          grid: { color: alpha("#183122", isDark ? 0.2 : 0.08) },
        },
        y: {
          title: {
            display: true,
            text: t("dashboard_page.mandi.price_axis", {
              defaultValue: "Price (Rs/quintal)",
            }),
            color: isDark ? "#eef7e8" : "#20492e",
            font: { weight: 700 },
          },
          ticks: {
            color: isDark ? "#eef7e8" : "#355740",
            callback: (value) => `Rs ${formatCurrencyCompact(Number(value))}`,
          },
          grid: { color: alpha("#183122", isDark ? 0.18 : 0.08) },
        },
      },
    }),
    [isDark, mandiForm.market, resolvedMandiState, t],
  );

  const tableSummary = React.useMemo(() => {
    if (!mandiRowsWithChange.length) return null;
    const strongestRise = [...mandiRowsWithChange].sort((a, b) => b.delta - a.delta)[0];
    const sharpestDrop = [...mandiRowsWithChange].sort((a, b) => a.delta - b.delta)[0];
    return { strongestRise, sharpestDrop };
  }, [mandiRowsWithChange]);

  return (
    <Grid container spacing={3} id="market-data">
      <Grid item xs={12} id="mandi-section">
        <Card sx={cardSx}>
          <Box sx={cardHeaderSx}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={1.2}
              alignItems={{ xs: "flex-start", lg: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    bgcolor: isDark ? "rgba(219, 149, 35, 0.22)" : "rgba(141, 87, 0, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <InsightsIcon color="secondary" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={sectionTitleSx}>
                    {t("dashboard_page.mandi.market_intelligence", {
                      defaultValue: "Mandi Market Intelligence",
                    })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("dashboard_page.mandi.subtitle", {
                      defaultValue:
                        "Track live crop movement, nearby mandis, and field-ready price signals.",
                    })}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <Chip
                  size="small"
                  icon={<ExploreIcon />}
                  label={
                    locationLabel ||
                    t("dashboard_page.mandi.location_hint", {
                      defaultValue: "Enable location for nearby mandis.",
                    })
                  }
                  sx={{ ...chipPillSx, height: 30, maxWidth: 280 }}
                />
                <Chip
                  size="small"
                  icon={<MyLocationIcon />}
                  label={preciseLocationLabel}
                  sx={{ ...chipPillSx, height: 30 }}
                />
                <Chip
                  size="small"
                  icon={<SyncIcon />}
                  label={transportLabel}
                  color={tradingTransportMode === "websocket" ? "success" : "default"}
                  sx={{ borderRadius: 999, fontWeight: 700, height: 30 }}
                />
                {coordinateLabel && (
                  <Chip
                    size="small"
                    label={coordinateLabel}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 700,
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.72)",
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.18)"
                        : "1px solid rgba(28,77,44,0.08)",
                    }}
                  />
                )}
                <Tooltip
                  title={t("dashboard_page.mandi.refresh_gps", {
                    defaultValue: "Refresh GPS for mandi and weather accuracy",
                  })}
                >
                  <span>
                    <IconButton
                      size="small"
                      onClick={refreshLocation}
                      disabled={isLocating}
                      sx={{
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.16)"
                          : "1px solid rgba(28,77,44,0.12)",
                        bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      <SyncIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 2.2 }}>
            <Stack spacing={2.6}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.4}
                sx={{
                  p: 1.6,
                  borderRadius: 2.5,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(28, 77, 44, 0.08)",
                  background: isDark ? "rgba(12, 32, 22, 0.85)" : "rgba(255,255,255,0.85)",
                }}
              >
                <TextField
                  select
                  label={t("dashboard_page.mandi.category_label", {
                    defaultValue: "Category",
                  })}
                  value={mandiCategory}
                  onChange={(event) => setMandiCategory(String(event.target.value))}
                  size="small"
                  fullWidth
                >
                  {mandiCategoryOptions.map((category) => (
                    <MenuItem key={category} value={category}>
                      {translateCategory(category)}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("dashboard_page.forms.crop")}
                  value={mandiForm.crop}
                  onChange={(event) =>
                    setMandiForm((prev) => ({
                      ...prev,
                      crop: String(event.target.value),
                    }))
                  }
                  size="small"
                  fullWidth
                >
                  {filteredMandiCrops.map((crop) => (
                    <MenuItem key={crop} value={crop}>
                      {crop}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("dashboard_page.forms.market")}
                  value={mandiForm.market}
                  onChange={(event) =>
                    setMandiForm((prev) => ({
                      ...prev,
                      market: String(event.target.value),
                    }))
                  }
                  size="small"
                  fullWidth
                >
                  {mandiMarkets.map((market) => (
                    <MenuItem key={market} value={market}>
                      {market}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label={t("dashboard_page.forms.days")}
                  value={mandiForm.days}
                  onChange={(event) =>
                    setMandiForm((prev) => ({
                      ...prev,
                      days: Number(event.target.value),
                    }))
                  }
                  size="small"
                  fullWidth
                >
                  {[1, 7, 30].map((days) => (
                    <MenuItem key={days} value={days}>
                      {t("dashboard_page.mandi.days_option", {
                        defaultValue: "{{count}} days",
                        count: days,
                      })}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  variant="contained"
                  onClick={() =>
                    mandiMutation.mutate({
                      ...mandiForm,
                      crop: mandiForm.crop.trim(),
                      market: mandiForm.market.trim(),
                    })
                  }
                  disabled={mandiMutation.isPending}
                  sx={{ minWidth: 120, height: 40, fontWeight: 700 }}
                >
                  {mandiMutation.isPending ? t("actions.loading") : t("actions.fetch")}
                </Button>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {quickFilters.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    clickable
                    size="small"
                    variant={
                      mandiForm.crop === chip.crop ||
                      (!chip.crop && mandiCategory === chip.category)
                        ? "filled"
                        : "outlined"
                    }
                    color={
                      mandiForm.crop === chip.crop ||
                      (!chip.crop && mandiCategory === chip.category)
                        ? "secondary"
                        : "default"
                    }
                    onClick={() => {
                      if (!chip.crop) {
                        setMandiCategory(chip.category);
                      } else {
                        setMandiCategory("all");
                        setMandiForm((prev) => ({ ...prev, crop: chip.crop }));
                      }
                    }}
                    sx={{ mb: 1, borderRadius: 999, fontWeight: 700 }}
                  />
                ))}
                <Chip
                  size="small"
                  variant="outlined"
                  label={t("dashboard_page.mandi.crops_count", {
                    defaultValue: "{{count}} crops",
                    count: filteredMandiCrops.length,
                  })}
                  sx={{ mb: 1, borderRadius: 999, fontWeight: 700 }}
                />
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip icon={<ExploreIcon />} label={selectedScope} sx={chipPillSx} />
                <Chip
                  icon={<CalendarMonthIcon />}
                  label={t("dashboard_page.mandi.days_option", {
                    defaultValue: "{{count}} days",
                    count: mandiForm.days,
                  })}
                  sx={chipPillSx}
                />
                <Chip icon={<CurrencyRupeeIcon />} label={mandiForm.crop} sx={chipPillSx} />
                <Chip
                  label={`${t("dashboard_page.mandi.feed_source", { defaultValue: "Feed" })}: ${sourceLabel}`}
                  sx={chipPillSx}
                />
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("dashboard_page.mandi.nearest_markets", {
                    defaultValue: "Nearest Markets Near You",
                  })}
                </Typography>
                {nearestMarkets.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {nearestMarkets.map((market) => (
                      <Chip
                        key={market.name}
                        label={`${market.name} | ${t("dashboard_page.mandi.km_away", {
                          defaultValue: "{{distance}} km",
                          distance: market.distanceKm.toFixed(0),
                        })}`}
                        clickable
                        color={mandiForm.market === market.name ? "secondary" : "default"}
                        onClick={() =>
                          setMandiForm((prev) => ({
                            ...prev,
                            market: market.name,
                          }))
                        }
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {t("dashboard_page.mandi.location_hint", {
                      defaultValue: "Enable precise GPS to auto-detect the nearest mandis.",
                    })}
                  </Typography>
                )}
              </Stack>

              {mandiCards.length > 0 && (
                <Grid container spacing={2}>
                  {mandiCards.map((card) => {
                    const trendUp = card.changePct >= 0;
                    return (
                      <Grid item xs={12} md={4} key={`${card.market}-${card.crop}`}>
                        <Card
                          sx={{
                            height: "100%",
                            borderRadius: 3,
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.1)"
                              : "1px solid rgba(21, 86, 45, 0.16)",
                            background: isDark
                              ? "linear-gradient(145deg, rgba(18, 46, 32, 0.98) 0%, rgba(12, 34, 24, 0.98) 100%)"
                              : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(242, 249, 242, 0.98) 100%)",
                            boxShadow: isDark
                              ? "0 16px 26px rgba(0,0,0,0.35)"
                              : "0 16px 26px rgba(16, 66, 35, 0.12)",
                          }}
                        >
                          <CardContent>
                            <Stack spacing={1.2}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                    {card.crop}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {card.market}
                                  </Typography>
                                </Box>
                                {typeof card.distanceKm === "number" && (
                                  <Chip
                                    size="small"
                                    label={t("dashboard_page.mandi.km_away", {
                                      defaultValue: "{{distance}} km",
                                      distance: card.distanceKm.toFixed(0),
                                    })}
                                    sx={{ borderRadius: 999, fontWeight: 700 }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={2} justifyContent="space-between">
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("dashboard_page.mandi.min_label", {
                                      defaultValue: "Min",
                                    })}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(card.min)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("dashboard_page.mandi.max_label", {
                                      defaultValue: "Max",
                                    })}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(card.max)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("dashboard_page.mandi.modal_label", {
                                      defaultValue: "Modal",
                                    })}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(card.modal)}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Stack direction="row" spacing={0.7} alignItems="center">
                                {trendUp ? (
                                  <TrendingUpIcon fontSize="small" sx={{ color: "success.main" }} />
                                ) : (
                                  <TrendingDownIcon
                                    fontSize="small"
                                    sx={{ color: "warning.main" }}
                                  />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: trendUp ? "success.main" : "warning.main",
                                    fontWeight: 700,
                                  }}
                                >
                                  {trendUp ? "+" : ""}
                                  {card.changePct.toFixed(2)}%
                                </Typography>
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}

              {effectiveSummary && (
                <Grid container spacing={1.2}>
                  {[
                    {
                      key: "latest",
                      icon: <CurrencyRupeeIcon fontSize="small" />,
                      title: t("dashboard_page.mandi.latest_label", {
                        defaultValue: "Latest modal",
                      }),
                      value: formatCurrency(effectiveSummary.latest),
                      tone: "success",
                    },
                    {
                      key: "range",
                      icon: <TimelineIcon fontSize="small" />,
                      title: t("dashboard_page.mandi.range_label", {
                        defaultValue: "Trading range",
                      }),
                      value: `${formatCurrency(effectiveSummary.min)} - ${formatCurrency(effectiveSummary.max)}`,
                      tone: "default",
                    },
                    {
                      key: "delta",
                      icon:
                        effectiveSummary.changePct >= 0 ? (
                          <TrendingUpIcon fontSize="small" />
                        ) : (
                          <TrendingDownIcon fontSize="small" />
                        ),
                      title: `${mandiForm.days}d change`,
                      value: `${effectiveSummary.changePct >= 0 ? "+" : ""}${effectiveSummary.changePct.toFixed(2)}%`,
                      tone: effectiveSummary.changePct >= 0 ? "success" : "warning",
                    },
                    {
                      key: "previous",
                      icon: <TimelineIcon fontSize="small" />,
                      title: t("dashboard_page.mandi.previous_print", {
                        defaultValue: "Previous print",
                      }),
                      value: formatCurrency(previousPrint),
                      tone: "default",
                    },
                    {
                      key: "window",
                      icon: <CalendarMonthIcon fontSize="small" />,
                      title: t("dashboard_page.mandi.active_window", {
                        defaultValue: "Active window",
                      }),
                      value: t("dashboard_page.mandi.days_option", {
                        defaultValue: "{{count}} days",
                        count: mandiForm.days,
                      }),
                      tone: "default",
                    },
                    {
                      key: "sync",
                      icon: <SyncIcon fontSize="small" />,
                      title: t("dashboard_page.mandi.last_sync", {
                        defaultValue: "Last sync",
                      }),
                      value: lastSyncLabel,
                      tone: "default",
                    },
                  ].map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.key}>
                      <Paper
                        elevation={0}
                        sx={{
                          height: "100%",
                          p: 1.5,
                          borderRadius: 2.5,
                          border: isDark
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "1px solid rgba(28,77,44,0.08)",
                          bgcolor: isDark ? "rgba(9, 28, 19, 0.72)" : "rgba(255,255,255,0.78)",
                        }}
                      >
                        <Stack spacing={0.7}>
                          <Stack
                            direction="row"
                            spacing={0.8}
                            alignItems="center"
                            color="text.secondary"
                          >
                            {item.icon}
                            <Typography variant="caption" sx={{ fontWeight: 700 }}>
                              {item.title}
                            </Typography>
                          </Stack>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 800,
                              color:
                                item.tone === "success"
                                  ? "success.main"
                                  : item.tone === "warning"
                                    ? "warning.main"
                                    : "text.primary",
                            }}
                          >
                            {item.value}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}

              {Boolean(tradingError) && (
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" size="small" onClick={refreshTradingSnapshot}>
                      {t("actions.retry", { defaultValue: "Retry" })}
                    </Button>
                  }
                >
                  {tradingError instanceof Error
                    ? tradingError.message
                    : t("dashboard_page.mandi.load_error")}
                </Alert>
              )}
              {mandiMutation.isError && (
                <Alert severity="error">
                  {mandiMutation.error instanceof Error
                    ? mandiMutation.error.message
                    : t("dashboard_page.mandi.load_error")}
                </Alert>
              )}
              {staleWarning && <Alert severity="warning">{staleWarning}</Alert>}

              <Box>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 1.2 }}
                  spacing={1.5}
                >
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {t("dashboard_page.mandi.price_trend", {
                        defaultValue: "Price trend",
                      })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard_page.mandi.chart_caption", {
                        defaultValue:
                          "Field view of mandi movement using precise GPS-selected markets.",
                      })}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {tradingIsRefreshing && (
                      <Chip
                        size="small"
                        label={t("dashboard_page.mandi.refreshing", {
                          defaultValue: "Refreshing",
                        })}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      />
                    )}
                    {[1, 7, 30].map((days) => (
                      <Chip
                        key={days}
                        label={`${days}d`}
                        clickable
                        variant={mandiForm.days === days ? "filled" : "outlined"}
                        color={mandiForm.days === days ? "secondary" : "default"}
                        onClick={() => setMandiForm((prev) => ({ ...prev, days }))}
                        size="small"
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      />
                    ))}
                  </Stack>
                </Stack>
                {enhancedMandiChartData ? (
                  <Box
                    sx={{
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 3,
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(25, 69, 41, 0.12)",
                      backgroundImage: isDark
                        ? "linear-gradient(180deg, rgba(12, 28, 20, 0.84) 0%, rgba(17, 43, 29, 0.8) 100%), linear-gradient(90deg, rgba(10, 21, 15, 0.24), rgba(10, 21, 15, 0.08)), url('/assets/agri-slider/slide-07.jpg')"
                        : "linear-gradient(180deg, rgba(249, 253, 244, 0.86) 0%, rgba(233, 245, 223, 0.82) 100%), linear-gradient(90deg, rgba(245, 250, 240, 0.68), rgba(255, 255, 255, 0.2)), url('/assets/agri-slider/slide-07.jpg')",
                      backgroundSize: "cover",
                      backgroundPosition: "center center",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: isDark
                          ? "linear-gradient(90deg, rgba(9, 28, 19, 0.3), rgba(9, 28, 19, 0.05) 28%, rgba(9, 28, 19, 0.3))"
                          : "linear-gradient(90deg, rgba(255,255,255,0.24), rgba(255,255,255,0.04) 28%, rgba(255,255,255,0.24))",
                      }}
                    />
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1.1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", md: "center" }}
                      sx={{ px: 2, pt: 2, position: "relative", zIndex: 1 }}
                    >
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip icon={<ExploreIcon />} label={selectedScope} sx={chipPillSx} />
                        <Chip
                          icon={<CalendarMonthIcon />}
                          label={`${mandiForm.days} day window`}
                          sx={chipPillSx}
                        />
                        <Chip icon={<CurrencyRupeeIcon />} label={mandiForm.crop} sx={chipPillSx} />
                      </Stack>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip label={transportLabel} sx={chipPillSx} />
                        <Chip
                          label={`${t("dashboard_page.mandi.last_sync", { defaultValue: "Last sync" })}: ${lastSyncLabel}`}
                          sx={chipPillSx}
                        />
                      </Stack>
                    </Stack>
                    <Box
                      sx={{
                        position: "relative",
                        zIndex: 1,
                        px: { xs: 1, md: 2 },
                        pb: 1.4,
                        pt: 1,
                        height: 420,
                      }}
                    >
                      <Line data={enhancedMandiChartData} options={chartOptions} />
                    </Box>
                  </Box>
                ) : tradingIsLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    {t("actions.loading", { defaultValue: "Loading..." })}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard_page.mandi.empty")}
                  </Typography>
                )}
              </Box>

              <Grid container spacing={1.2}>
                <Grid item xs={12} md={6}>
                  <MoversCard
                    items={tradingSnapshot?.gainers || []}
                    title={t("dashboard_page.mandi.top_gainers", {
                      defaultValue: "Top gaining crops",
                    })}
                    emptyLabel={t("dashboard_page.mandi.top_gainers_empty", {
                      defaultValue:
                        "Not enough mandi entries are available yet to rank gainers in this scope.",
                    })}
                    positive
                    isDark={isDark}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <MoversCard
                    items={tradingSnapshot?.losers || []}
                    title={t("dashboard_page.mandi.top_losers", {
                      defaultValue: "Top losing crops",
                    })}
                    emptyLabel={t("dashboard_page.mandi.top_losers_empty", {
                      defaultValue:
                        "Not enough mandi entries are available yet to rank losers in this scope.",
                    })}
                    positive={false}
                    isDark={isDark}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.7,
                      borderRadius: 2.8,
                      border: isDark
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid rgba(28,77,44,0.08)",
                      bgcolor: isDark ? "rgba(9, 28, 19, 0.72)" : "rgba(255,255,255,0.82)",
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 1.2 }}
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {t("dashboard_page.mandi.live_tape", {
                            defaultValue: "Live tape",
                          })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("dashboard_page.mandi.live_tape_caption", {
                            defaultValue:
                              "Recent mandi prints for the active crop and market scope.",
                          })}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`${t("dashboard_page.mandi.market_depth", { defaultValue: "Market depth" })}: ${tradingRecentTape.length}`}
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      />
                    </Stack>
                    {tradingRecentTape.length ? (
                      <Stack spacing={0.9}>
                        {tradingRecentTape.map((point) => (
                          <Paper
                            key={`${point.crop}-${point.mandi}-${point.timestamp}`}
                            elevation={0}
                            sx={{
                              px: 1.25,
                              py: 1.05,
                              borderRadius: 2,
                              border: isDark
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(28,77,44,0.08)",
                              bgcolor: isDark
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(243, 249, 241, 0.76)",
                            }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={1.2}
                            >
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  {point.crop}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {point.mandi}
                                  {point.state ? `, ${point.state}` : ""}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: "right" }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                  {formatCurrency(point.price)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatMarketDateTime(point.timestamp)}
                                </Typography>
                              </Box>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t("dashboard_page.mandi.live_tape_empty", {
                          defaultValue:
                            "Recent prints will appear here as market snapshots refresh.",
                        })}
                      </Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {enhancedMandiChartData && (
                <Box>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1.2 }}
                  >
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t("dashboard_page.market_data.price_ledger", {
                          defaultValue: "Price ledger",
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t("dashboard_page.market_data.price_ledger_caption", {
                          defaultValue:
                            "Daily mandi observations arranged like a field trading sheet.",
                        })}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => setShowMandiTable((prev) => !prev)}
                      sx={{ fontWeight: 700 }}
                    >
                      {showMandiTable
                        ? t("dashboard_page.market_data.hide_price_table", {
                            defaultValue: "Hide price table",
                          })
                        : t("dashboard_page.market_data.show_price_table", {
                            defaultValue: "Show price table",
                          })}
                    </Button>
                  </Stack>
                  {showMandiTable && (
                    <Paper
                      elevation={0}
                      sx={{
                        overflow: "hidden",
                        borderRadius: 3,
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.08)"
                          : "1px solid rgba(25, 69, 41, 0.12)",
                        bgcolor: isDark ? "rgba(9, 28, 19, 0.72)" : "rgba(255,255,255,0.82)",
                      }}
                    >
                      {tableSummary && (
                        <>
                          <Stack
                            direction={{ xs: "column", md: "row" }}
                            spacing={1.2}
                            justifyContent="space-between"
                            sx={{ px: 2, py: 1.5 }}
                          >
                            <Chip
                              icon={<TrendingUpIcon />}
                              label={`${t("dashboard_page.market_data.best_session", { defaultValue: "Best session" })}: ${formatMarketDate(
                                tableSummary.strongestRise.date,
                              )} (${tableSummary.strongestRise.delta >= 0 ? "+" : ""}${tableSummary.strongestRise.delta.toFixed(2)})`}
                              color="success"
                              variant="outlined"
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                            <Chip
                              icon={<TrendingDownIcon />}
                              label={`${t("dashboard_page.market_data.weakest_session", { defaultValue: "Weakest session" })}: ${formatMarketDate(
                                tableSummary.sharpestDrop.date,
                              )} (${tableSummary.sharpestDrop.delta.toFixed(2)})`}
                              color="warning"
                              variant="outlined"
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                          </Stack>
                          <Divider />
                        </>
                      )}
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow
                              sx={{
                                bgcolor: isDark
                                  ? "rgba(255,255,255,0.08)"
                                  : "rgba(27, 107, 58, 0.08)",
                              }}
                            >
                              <TableCell sx={{ fontWeight: 800 }}>
                                {t("dashboard_page.tables.date", {
                                  defaultValue: "Date",
                                })}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>
                                {t("dashboard_page.mandi.price_label", {
                                  defaultValue: "Price",
                                })}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>
                                {t("dashboard_page.market_data.delta", {
                                  defaultValue: "Delta",
                                })}
                              </TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>
                                {t("dashboard_page.market_data.signal", {
                                  defaultValue: "Signal",
                                })}
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mandiRowsWithChange.map((row, index) => {
                              const signal = getSignalTone(row.delta);
                              return (
                                <TableRow
                                  key={row.date}
                                  sx={{
                                    "&:nth-of-type(odd)": {
                                      bgcolor: isDark
                                        ? "rgba(255,255,255,0.03)"
                                        : "rgba(244,249,241,0.72)",
                                    },
                                    "&:hover": {
                                      bgcolor: isDark
                                        ? "rgba(255,255,255,0.06)"
                                        : "rgba(229,239,225,0.92)",
                                    },
                                  }}
                                >
                                  <TableCell>
                                    <Stack spacing={0.2}>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {formatMarketDate(row.date)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Session {index + 1}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                      {formatCurrency(row.price)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      color={row.delta >= 0 ? "success" : "warning"}
                                      label={`${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}`}
                                      sx={{
                                        borderRadius: 999,
                                        fontWeight: 700,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      color={signal.color}
                                      variant={signal.color === "default" ? "outlined" : "filled"}
                                      label={signal.label}
                                      sx={{
                                        borderRadius: 999,
                                        fontWeight: 700,
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  )}
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default React.memo(MarketDataSection);
