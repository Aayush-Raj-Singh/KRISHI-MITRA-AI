import React, { useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import InsightsIcon from "@mui/icons-material/Insights";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useQuery } from "@tanstack/react-query";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import {
  fetchTrendAnalytics,
  type TrendAnalyticsResponse,
  type TrendFilters,
} from "../services/trends";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
);

interface TrendAnalyticsContentProps {
  embedded?: boolean;
}

const formatCurrencyCompact = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const TrendAnalyticsHeader: React.FC<{ embedded: boolean }> = ({ embedded }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!embedded) {
    return (
      <AgricultureHero
        icon={<QueryStatsIcon color="primary" />}
        logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
        title={t("trend_analytics_page.title", { defaultValue: "Historical Trend Analytics" })}
        subtitle="A crop-market intelligence workspace for window-based price behavior, seasonal comparison, and spike detection before mandi action."
        badges={[
          "30/60/90-day windows",
          "Season comparison",
          "Spike detection",
          "Dispatch planning",
        ]}
        imageSrc="/assets/agri-slider/slide-04.jpg"
      />
    );
  }

  return (
    <Paper
      sx={{
        p: 2.3,
        borderRadius: 3,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(31,84,50,0.12)",
        background: isDark
          ? "linear-gradient(145deg, rgba(16,40,28,0.98) 0%, rgba(12,30,21,0.98) 100%)"
          : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(243,249,241,0.98) 100%)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Box>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
            Trend command lane
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t("trend_analytics_page.title", { defaultValue: "Historical Trend Analytics" })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, maxWidth: 680 }}>
            Compare rolling windows, detect price pressure, and convert market history into
            season-aware decisions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="flex-start">
          <ChipLike label="Seasonal view" />
          <ChipLike label="Risk watch" />
          <ChipLike label="Volatility aware" />
        </Stack>
      </Stack>
    </Paper>
  );
};

const ChipLike: React.FC<{ label: string }> = ({ label }) => (
  <Box
    sx={{
      px: 1.2,
      py: 0.6,
      borderRadius: 999,
      border: "1px solid rgba(31,84,50,0.14)",
      bgcolor: "rgba(255,255,255,0.72)",
      fontWeight: 700,
      fontSize: "0.82rem",
    }}
  >
    {label}
  </Box>
);

const buildWindowChart = (
  response: TrendAnalyticsResponse,
  t: (key: string, options?: Record<string, unknown>) => string,
  isDark: boolean,
): Array<{
  windowDays: number;
  chartData: ChartData<"line", number[], string>;
  changePct: number;
  volatility: number;
}> =>
  response.windows.map((window) => ({
    windowDays: window.window_days,
    changePct: window.change_pct,
    volatility: window.volatility,
    chartData: {
      labels: window.points.map((point) => point.date),
      datasets: [
        {
          label: t("trend_analytics_page.avg_price_label", {
            defaultValue: "{{days}}-day Avg Price",
            days: window.window_days,
          }),
          data: window.points.map((point) => point.avg_price),
          borderColor: isDark ? "#d8a15c" : "#1b6b3a",
          backgroundColor: alpha(isDark ? "#d8a15c" : "#1b6b3a", 0.15),
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 3,
        },
      ],
    },
  }));

export const TrendAnalyticsContent: React.FC<TrendAnalyticsContentProps> = ({
  embedded = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const mandiOptions = useMandiFilterOptions();
  const [draftFilters, setDraftFilters] = useState<TrendFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<TrendFilters>({});
  const selectedState = draftFilters.state?.trim() || "";
  const selectedDistrict = draftFilters.district?.trim() || "";
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict
      ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict)
      : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["trend-analytics", appliedFilters],
    queryFn: () => fetchTrendAnalytics(appliedFilters),
  });

  const handleApply = () => setAppliedFilters(draftFilters);

  const handleFilterChange = (key: keyof TrendFilters, value: string) => {
    const nextValue = value.trim();
    setDraftFilters((prev) => {
      const next: TrendFilters = { ...prev, [key]: nextValue ? nextValue : undefined };
      if (key === "state" && (prev.state || "") !== nextValue) {
        next.district = undefined;
        next.mandi = undefined;
      }
      if (key === "district" && (prev.district || "") !== nextValue) {
        next.mandi = undefined;
      }
      return next;
    });
  };

  const windowCharts = useMemo(
    () => (data ? buildWindowChart(data, t, isDark) : []),
    [data, isDark, t],
  );
  const seasonalChartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.seasonal.map((item) => item.season),
      datasets: [
        {
          label: t("trend_analytics_page.seasonal_avg_price", {
            defaultValue: "Seasonal Avg Price",
          }),
          data: data.seasonal.map((item) => item.average_price),
          backgroundColor: data.seasonal.map((_item, index) =>
            index % 2 === 0 ? "rgba(27, 107, 58, 0.72)" : "rgba(181, 105, 32, 0.72)",
          ),
        },
      ],
    };
  }, [data, t]);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    const primaryWindow = data.windows[0];
    const seasonalPeak = [...data.seasonal].sort((a, b) => b.average_price - a.average_price)[0];
    return [
      {
        label: "Overall volatility",
        value: data.volatility.toFixed(2),
        accent: "#1f6d45",
        icon: <AutoGraphIcon />,
      },
      {
        label: "Primary window change",
        value: primaryWindow ? `${primaryWindow.change_pct.toFixed(2)}%` : "--",
        accent: primaryWindow && primaryWindow.change_pct >= 0 ? "#1f6d45" : "#a44a16",
        icon: <ShowChartIcon />,
      },
      {
        label: "Seasonal peak",
        value: seasonalPeak
          ? `${seasonalPeak.season} · ${formatCurrencyCompact(seasonalPeak.average_price)}`
          : "--",
        accent: "#8f4c1a",
        icon: <InsightsIcon />,
      },
      {
        label: "Spike alerts",
        value: data.alerts.length,
        accent: "#446f95",
        icon: <WarningAmberIcon />,
      },
    ];
  }, [data]);

  const compactChartOptions = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      normalized: true,
      plugins: { legend: { display: false } },
    }),
    [],
  );

  const filterFields: Array<{
    key: keyof TrendFilters;
    label: string;
    options: string[];
    disabled?: boolean;
  }> = [
    {
      label: t("filters.state", { defaultValue: "State" }),
      key: "state",
      options: mandiOptions.states,
    },
    {
      label: t("filters.district", { defaultValue: "District" }),
      key: "district",
      options: districtsForState,
      disabled: !selectedState,
    },
    {
      label: t("filters.mandi", { defaultValue: "Mandi" }),
      key: "mandi",
      options: mandisForDistrict,
      disabled: !selectedState || !selectedDistrict,
    },
    {
      label: t("filters.commodity", { defaultValue: "Commodity" }),
      key: "commodity",
      options: mandiOptions.commodities,
    },
  ];

  return (
    <Stack spacing={3}>
      <TrendAnalyticsHeader embedded={embedded} />

      <Paper
        sx={{
          p: { xs: 2.2, md: 2.8 },
          borderRadius: 3,
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(31,84,50,0.12)",
          background: isDark
            ? "linear-gradient(145deg, rgba(14,35,24,0.98) 0%, rgba(10,25,18,0.98) 100%)"
            : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Trend filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Build a market history slice by geography, crop, and time range before comparing
                windows and seasonal patterns.
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleApply} sx={{ fontWeight: 700 }}>
              {t("filters.apply", { defaultValue: "Apply" })}
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {filterFields.map((field) => (
              <Grid item xs={12} sm={6} md={3} key={field.key}>
                <FilterAutocomplete
                  label={field.label}
                  value={(draftFilters as Record<string, string>)[field.key] || ""}
                  options={field.options}
                  disabled={field.disabled}
                  onChange={(value) => handleFilterChange(field.key, value)}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t("filters.from_date", { defaultValue: "From date" })}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={draftFilters.date_from || ""}
                onChange={(event) =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    date_from: event.target.value || undefined,
                  }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t("filters.to_date", { defaultValue: "To date" })}
                type="date"
                InputLabelProps={{ shrink: true }}
                value={draftFilters.date_to || ""}
                onChange={(event) =>
                  setDraftFilters((prev) => ({ ...prev, date_to: event.target.value || undefined }))
                }
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {isLoading && (
        <Alert severity="info">
          {t("trend_analytics_page.loading", { defaultValue: "Loading trend analytics..." })}
        </Alert>
      )}
      {error && <Alert severity="error">{t("common.request_failed")}</Alert>}

      {data && (
        <>
          <Grid container spacing={2.2}>
            {summaryCards.map((stat) => (
              <Grid item xs={12} sm={6} lg={3} key={stat.label}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: `1px solid ${alpha(stat.accent, 0.16)}`,
                    background: isDark
                      ? `linear-gradient(145deg, ${alpha(stat.accent, 0.16)} 0%, rgba(13, 28, 18, 0.92) 100%)`
                      : `linear-gradient(145deg, ${alpha(stat.accent, 0.08)} 0%, rgba(255,255,255,0.95) 100%)`,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={1.4}>
                    <Box>
                      <Typography variant="caption" sx={{ color: stat.accent, fontWeight: 800 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 0.7, fontWeight: 800 }}>
                        {stat.value}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: alpha(stat.accent, 0.14), color: stat.accent }}>
                      {stat.icon}
                    </Avatar>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.4}>
            {windowCharts.map((item) => (
              <Grid item xs={12} xl={4} key={item.windowDays}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: "1px solid rgba(31,84,50,0.12)",
                    background: isDark
                      ? "linear-gradient(145deg, rgba(14,35,24,0.98) 0%, rgba(10,25,18,0.98) 100%)"
                      : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
                  }}
                >
                  <Box sx={{ px: 2.3, py: 1.8, borderBottom: "1px solid rgba(31,84,50,0.1)" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {item.windowDays}-day window
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Change {item.changePct.toFixed(2)}% · Volatility {item.volatility.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2.2, height: 320 }}>
                    <Line data={item.chartData} options={compactChartOptions} />
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.4}>
            <Grid item xs={12} lg={7}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: "1px solid rgba(31,84,50,0.12)",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(14,35,24,0.98) 0%, rgba(10,25,18,0.98) 100%)"
                    : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
                }}
              >
                <Box sx={{ px: 2.3, py: 1.8, borderBottom: "1px solid rgba(31,84,50,0.1)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t("trend_analytics_page.seasonal_comparison", {
                      defaultValue: "Seasonal Comparison",
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Compare average price performance across seasonal buckets.
                  </Typography>
                </Box>
                <Box sx={{ p: 2.2, height: 320 }}>
                  {seasonalChartData && <Bar data={seasonalChartData} />}
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid rgba(31,84,50,0.12)",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(14,35,24,0.98) 0%, rgba(10,25,18,0.98) 100%)"
                    : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
                }}
              >
                <Box sx={{ px: 2.3, py: 1.8, borderBottom: "1px solid rgba(31,84,50,0.1)" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {t("trend_analytics_page.price_spike_alerts", {
                      defaultValue: "Price Spike Alerts",
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Escalation-ready notes for unusual price moves inside the selected history
                    window.
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2 }}>
                  {data.alerts.length === 0 ? (
                    <Alert severity="success" sx={{ m: 1 }}>
                      {t("trend_analytics_page.no_spike_alerts", {
                        defaultValue: "No spike alerts detected.",
                      })}
                    </Alert>
                  ) : (
                    <List sx={{ py: 0 }}>
                      {data.alerts.map((alert) => (
                        <ListItem key={`${alert.date}-${alert.change_pct}`} alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar
                              sx={{
                                bgcolor: alpha(alert.change_pct >= 0 ? "#1f6d45" : "#a44a16", 0.14),
                                color: alert.change_pct >= 0 ? "#1f6d45" : "#a44a16",
                              }}
                            >
                              <WarningAmberIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`${alert.date} · ${alert.change_pct.toFixed(2)}%`}
                            secondary={`${alert.note} (Abs ${alert.change_abs.toFixed(2)})`}
                            primaryTypographyProps={{ fontWeight: 700 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
};

const TrendAnalyticsPage: React.FC = () => (
  <AppLayout>
    <TrendAnalyticsContent />
  </AppLayout>
);

export default TrendAnalyticsPage;
