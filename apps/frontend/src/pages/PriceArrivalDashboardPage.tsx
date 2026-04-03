import React, { useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import PriceChangeIcon from "@mui/icons-material/PriceChange";
import TimelineIcon from "@mui/icons-material/Timeline";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import { useQuery } from "@tanstack/react-query";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import useLocalSuggestions from "../hooks/useLocalSuggestions";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import { fetchPriceArrivalDashboard, type PriceArrivalFilters } from "../services/dashboard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
);

interface PriceArrivalDashboardContentProps {
  embedded?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const PriceArrivalHeader: React.FC<{ embedded: boolean }> = ({ embedded }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!embedded) {
    return (
      <AgricultureHero
        icon={<WarehouseIcon color="primary" />}
        logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
        title={t("price_arrival_page.title", { defaultValue: "Price + Arrival Intelligence" })}
        subtitle="A mandi flow console for arrivals, price spread, and modal-rate behavior across crop, grade, and market combinations."
        badges={["Arrival pressure", "Modal vs average", "Spread watch", "Field dispatch timing"]}
        imageSrc="/assets/agri-slider/slide-10.jpg"
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
            Arrival intelligence lane
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t("price_arrival_page.title", { defaultValue: "Price + Arrival Intelligence" })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, maxWidth: 700 }}>
            Compare mandi flow, modal-price behavior, and spread pressure in one decision workspace.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="flex-start">
          <QuickBadge label="Spread watch" />
          <QuickBadge label="Arrival signal" />
          <QuickBadge label="Grade-aware" />
        </Stack>
      </Stack>
    </Paper>
  );
};

const QuickBadge: React.FC<{ label: string }> = ({ label }) => (
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

export const PriceArrivalDashboardContent: React.FC<PriceArrivalDashboardContentProps> = ({
  embedded = false,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const mandiOptions = useMandiFilterOptions();
  const varietySuggestions = useLocalSuggestions("price_arrival.variety");
  const gradeSuggestions = useLocalSuggestions("price_arrival.grade");
  const [draftFilters, setDraftFilters] = useState<PriceArrivalFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<PriceArrivalFilters>({});
  const selectedState = draftFilters.state?.trim() || "";
  const selectedDistrict = draftFilters.district?.trim() || "";
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict
      ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict)
      : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["price-arrival", appliedFilters],
    queryFn: () => fetchPriceArrivalDashboard(appliedFilters),
  });

  const series = data?.series || [];
  const latestPoint = series[series.length - 1];
  const earliestPoint = series[0];

  const priceChartData = useMemo(
    () => ({
      labels: series.map((item) => item.date),
      datasets: [
        {
          label: t("price_arrival_page.average_price", { defaultValue: "Average Price" }),
          data: series.map((item) => item.avg_price),
          borderColor: isDark ? "#d8a15c" : "#1b6b3a",
          backgroundColor: alpha(isDark ? "#d8a15c" : "#1b6b3a", 0.15),
          tension: 0.35,
          fill: true,
          borderWidth: 3,
          pointRadius: 3,
        },
        {
          label: t("price_arrival_page.modal_price_label", { defaultValue: "Modal Price" }),
          data: series.map((item) => item.modal_price),
          borderColor: isDark ? "#f4c77a" : "#b65d2a",
          backgroundColor: alpha(isDark ? "#f4c77a" : "#b65d2a", 0.1),
          tension: 0.28,
          fill: false,
          borderWidth: 2.6,
          pointRadius: 2,
        },
      ],
    }),
    [isDark, series, t],
  );

  const arrivalsChartData = useMemo(
    () => ({
      labels: series.map((item) => item.date),
      datasets: [
        {
          label: t("price_arrival_page.arrivals_qtl", { defaultValue: "Arrivals (qtl)" }),
          data: series.map((item) => item.arrivals_qtl),
          backgroundColor: series.map((_item, index) =>
            index % 2 === 0 ? "rgba(27, 107, 58, 0.72)" : "rgba(181, 105, 32, 0.72)",
          ),
        },
      ],
    }),
    [series, t],
  );

  const handleFilterChange = (key: keyof PriceArrivalFilters, value: string) => {
    const nextValue = value.trim();
    setDraftFilters((prev) => {
      const next: PriceArrivalFilters = { ...prev, [key]: nextValue ? nextValue : undefined };
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

  const handleApply = () => {
    if (draftFilters.variety) varietySuggestions.addSuggestion(draftFilters.variety);
    if (draftFilters.grade) gradeSuggestions.addSuggestion(draftFilters.grade);
    setAppliedFilters(draftFilters);
  };

  const summaryCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        label: t("price_arrival_page.avg_price", { defaultValue: "Avg Price" }),
        value: formatCurrency(data.summary.average_price),
        accent: "#1f6d45",
        icon: <PriceChangeIcon />,
      },
      {
        label: t("price_arrival_page.modal_price", { defaultValue: "Modal Price" }),
        value: formatCurrency(data.summary.modal_price),
        accent: "#8f4c1a",
        icon: <BarChartIcon />,
      },
      {
        label: t("price_arrival_page.price_spread", { defaultValue: "Price Spread" }),
        value: formatCurrency(data.summary.price_spread),
        accent: "#446f95",
        icon: <TimelineIcon />,
      },
      {
        label: t("price_arrival_page.total_arrivals", { defaultValue: "Total Arrivals (qtl)" }),
        value: new Intl.NumberFormat().format(data.summary.total_arrivals_qtl),
        accent: "#7a5a2d",
        icon: <LocalShippingIcon />,
      },
    ];
  }, [data, t]);

  const filterFields: Array<{
    key: keyof PriceArrivalFilters & string;
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
    {
      label: t("filters.variety", { defaultValue: "Variety" }),
      key: "variety",
      options: varietySuggestions.suggestions,
    },
    {
      label: t("filters.grade", { defaultValue: "Grade" }),
      key: "grade",
      options: gradeSuggestions.suggestions,
    },
  ];

  return (
    <Stack spacing={3}>
      <PriceArrivalHeader embedded={embedded} />

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
                Arrival filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Narrow the arrival dashboard by location, crop, variety, grade, and trading window.
              </Typography>
            </Box>
            <Button variant="contained" onClick={handleApply} sx={{ fontWeight: 700 }}>
              {t("filters.apply_filters", { defaultValue: "Apply Filters" })}
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {filterFields.map((field) => (
              <Grid item xs={12} sm={6} md={4} key={field.key}>
                <FilterAutocomplete
                  label={field.label}
                  value={(draftFilters as Record<string, string>)[field.key] || ""}
                  options={field.options}
                  disabled={field.disabled}
                  onChange={(value) => handleFilterChange(field.key, value)}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={4}>
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
            <Grid item xs={12} sm={6} md={4}>
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
          {t("price_arrival_page.loading", { defaultValue: "Loading dashboard..." })}
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

          <Paper
            sx={{
              p: { xs: 2.3, md: 2.8 },
              borderRadius: 3,
              border: "1px solid rgba(31,84,50,0.12)",
              background: isDark
                ? "linear-gradient(145deg, rgba(15,34,24,0.98) 0%, rgba(11,24,17,0.98) 100%)"
                : "linear-gradient(145deg, rgba(247,251,244,0.98) 0%, rgba(255,255,255,0.98) 100%)",
            }}
          >
            <Grid container spacing={2.5}>
              <Grid item xs={12} lg={7.5}>
                <Stack spacing={1.2}>
                  <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
                    Current arrival pulse
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 800, fontSize: { xs: "1.7rem", md: "2.2rem" } }}
                  >
                    {appliedFilters.commodity || "Commodity flow desk"}
                    {appliedFilters.mandi ? ` · ${appliedFilters.mandi}` : ""}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Use the latest arrival and modal-price signal below to decide whether today’s
                    mandi movement reflects supply pressure or stronger buyer demand.
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {latestPoint && <Chip size="small" label={`Latest ${latestPoint.date}`} />}
                    {latestPoint && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Avg ${formatCurrency(latestPoint.avg_price)}`}
                      />
                    )}
                    {latestPoint && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Arrivals ${new Intl.NumberFormat().format(latestPoint.arrivals_qtl)} qtl`}
                      />
                    )}
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} lg={4.5}>
                <Stack spacing={1.2}>
                  <Paper
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#1f6d45", 0.08) }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Date span
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {earliestPoint?.date || "--"} to {latestPoint?.date || "--"}
                    </Typography>
                  </Paper>
                  <Paper
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#8f4c1a", 0.08) }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Records captured
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {data.summary.total_records}
                    </Typography>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Grid container spacing={2.4}>
            <Grid item xs={12} lg={7.5}>
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
                    {t("price_arrival_page.price_trend", { defaultValue: "Price Trend" })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average and modal price behavior across the selected arrival series.
                  </Typography>
                </Box>
                <Box sx={{ p: 2.2, height: 340 }}>
                  <Line
                    data={priceChartData}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12} lg={4.5}>
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
                    {t("price_arrival_page.arrivals_trend", { defaultValue: "Arrivals Trend" })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Arrival volume pressure that often explains the price shift above.
                  </Typography>
                </Box>
                <Box sx={{ p: 2.2, height: 340 }}>
                  <Bar
                    data={arrivalsChartData}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </Box>
              </Card>
            </Grid>
          </Grid>

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
                Arrival ledger
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Review each date’s price and arrivals together instead of reading them as separate
                reports.
              </Typography>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Average</TableCell>
                    <TableCell>Modal</TableCell>
                    <TableCell>Spread</TableCell>
                    <TableCell>Arrivals</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {series.map((item) => (
                    <TableRow key={item.date} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarMonthIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {item.date}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{formatCurrency(item.avg_price)}</TableCell>
                      <TableCell>{formatCurrency(item.modal_price)}</TableCell>
                      <TableCell>{formatCurrency(item.price_spread)}</TableCell>
                      <TableCell>{new Intl.NumberFormat().format(item.arrivals_qtl)} qtl</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </>
      )}
    </Stack>
  );
};

const PriceArrivalDashboardPage: React.FC = () => (
  <AppLayout>
    <PriceArrivalDashboardContent />
  </AppLayout>
);

export default PriceArrivalDashboardPage;
