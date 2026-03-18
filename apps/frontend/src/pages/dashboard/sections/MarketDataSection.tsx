import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ChartData } from "chart.js";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Line } from "react-chartjs-2";

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
  mandiSummary: { latest: number; min: number; max: number; changePct: number } | null;
  mandiResult: MandiPriceResponse | null;
  mandiChartData: ChartData<"line", number[], string> | null;
  showMandiTable: boolean;
  setShowMandiTable: React.Dispatch<React.SetStateAction<boolean>>;
  mandiRowsWithChange: Array<MandiPricePoint & { delta: number }>;
  mandiCards: MandiPriceCard[];
  nearestMarkets: NearestMarket[];
  locationLabel?: string;
}

const sectionTitleSx = {
  fontWeight: 700,
  letterSpacing: 0.2
} as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

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
  locationLabel
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const translateCategory = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (normalized === "all") return t("categories.all", { defaultValue: "All" });
    if (normalized === "cereals") return t("categories.cereals", { defaultValue: "Cereals" });
    if (normalized === "pulses") return t("categories.pulses", { defaultValue: "Pulses" });
    if (normalized === "oilseeds") return t("categories.oilseeds", { defaultValue: "Oilseeds" });
    if (normalized === "vegetables") return t("categories.vegetables", { defaultValue: "Vegetables" });
    if (normalized === "fruits") return t("categories.fruits", { defaultValue: "Fruits" });
    if (normalized === "spices") return t("categories.spices", { defaultValue: "Spices" });
    return value;
  };
  const quickFilters = [
    { key: "rice", label: t("crops.rice", { defaultValue: "Rice" }), crop: "Rice", category: "all" },
    { key: "wheat", label: t("crops.wheat", { defaultValue: "Wheat" }), crop: "Wheat", category: "all" },
    { key: "maize", label: t("crops.maize", { defaultValue: "Maize" }), crop: "Maize", category: "all" },
    { key: "pulses", label: t("crops.pulses", { defaultValue: "Pulses" }), crop: null, category: "pulses" },
    {
      key: "vegetables",
      label: t("crops.vegetables", { defaultValue: "Vegetables" }),
      crop: null,
      category: "vegetables"
    }
  ];

  const cardSx = {
    border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #dde6d4",
    borderRadius: 3,
    overflow: "hidden",
    boxShadow: isDark ? "0 20px 40px rgba(0, 0, 0, 0.35)" : "0 20px 40px rgba(19, 56, 32, 0.12)",
    background: isDark
      ? "linear-gradient(180deg, rgba(18, 50, 33, 0.98) 0%, rgba(14, 38, 26, 0.98) 100%)"
      : "linear-gradient(180deg, rgba(252, 255, 252, 0.98) 0%, rgba(244, 250, 243, 0.98) 100%)"
  } as const;

  const cardHeaderSx = {
    px: 2,
    py: 1.5,
    borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(28, 77, 44, 0.08)",
    background: isDark
      ? "linear-gradient(90deg, rgba(24, 66, 43, 0.8), rgba(12, 34, 24, 0.75))"
      : "linear-gradient(90deg, rgba(223, 240, 221, 0.7), rgba(247, 252, 247, 0.6))"
  } as const;

  const chipPillSx = {
    borderRadius: 999,
    fontWeight: 600,
    bgcolor: isDark ? "rgba(122, 194, 140, 0.16)" : "rgba(27, 107, 58, 0.08)",
    color: isDark ? "#cfead4" : "#1b6b3a",
    border: isDark ? "1px solid rgba(122, 194, 140, 0.28)" : "1px solid transparent"
  } as const;

  const chartOptions = React.useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { mode: "index" as const, intersect: false } },
      interaction: { mode: "nearest" as const, intersect: false },
      scales: {
        x: {
          ticks: { color: theme.palette.text.secondary },
          grid: { color: alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08) }
        },
        y: {
          ticks: { color: theme.palette.text.secondary },
          grid: { color: alpha(theme.palette.text.primary, isDark ? 0.14 : 0.08) }
        }
      }
    }),
    [isDark, theme.palette.text.primary, theme.palette.text.secondary]
  );

  return (
    <Grid container spacing={3} id="market-data">
      <Grid item xs={12} id="mandi-section">
        <Card sx={cardSx}>
          <Box sx={cardHeaderSx}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    bgcolor: isDark ? "rgba(219, 149, 35, 0.22)" : "rgba(141, 87, 0, 0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <InsightsIcon color="secondary" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={sectionTitleSx}>
                    {t("dashboard_page.mandi.market_intelligence", { defaultValue: "Mandi Market Intelligence" })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("dashboard_page.mandi.subtitle", { defaultValue: "Live crop, mandi, and price trend signals." })}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={t("dashboard_page.mandi.nearest_markets", { defaultValue: "Nearest Markets Near You" })}
                  sx={{ ...chipPillSx, height: 28 }}
                />
                {locationLabel && (
                  <Chip
                    size="small"
                    label={locationLabel}
                    sx={{
                      borderRadius: 999,
                      fontWeight: 600,
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : undefined,
                      border: isDark ? "1px solid rgba(255,255,255,0.18)" : undefined
                    }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>
          <CardContent sx={{ pt: 2.2 }}>
            <Stack spacing={2.4}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.4}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(28, 77, 44, 0.08)",
                  background: isDark ? "rgba(12, 32, 22, 0.85)" : "rgba(255,255,255,0.85)"
                }}
              >
                <TextField
                  select
                  label={t("dashboard_page.mandi.category_label", { defaultValue: "Category" })}
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
                  onChange={(event) => setMandiForm((prev) => ({ ...prev, crop: String(event.target.value) }))}
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
                  onChange={(event) => setMandiForm((prev) => ({ ...prev, market: String(event.target.value) }))}
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
                  onChange={(event) => setMandiForm((prev) => ({ ...prev, days: Number(event.target.value) }))}
                  size="small"
                  fullWidth
                >
                  {[7, 15, 30].map((days) => (
                    <MenuItem key={days} value={days}>
                      {t("dashboard_page.mandi.days_option", {
                        defaultValue: "{{count}} days",
                        count: days
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
                      market: mandiForm.market.trim()
                    })
                  }
                  disabled={mandiMutation.isPending}
                  sx={{ minWidth: 110, height: 40 }}
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
                    variant={mandiForm.crop === chip.crop || (!chip.crop && mandiCategory === chip.category) ? "filled" : "outlined"}
                    color={mandiForm.crop === chip.crop || (!chip.crop && mandiCategory === chip.category) ? "secondary" : "default"}
                    onClick={() => {
                      if (!chip.crop) {
                        setMandiCategory(chip.category);
                      } else {
                        setMandiCategory("all");
                        setMandiForm((prev) => ({ ...prev, crop: chip.crop }));
                      }
                    }}
                    sx={{ mb: 1, borderRadius: 999, fontWeight: 600 }}
                  />
                ))}
                <Chip
                  size="small"
                  variant="outlined"
                  label={t("dashboard_page.mandi.crops_count", {
                    defaultValue: "{{count}} crops",
                    count: filteredMandiCrops.length
                  })}
                  sx={{ mb: 1, borderRadius: 999, fontWeight: 600 }}
                />
              </Stack>

              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {t("dashboard_page.mandi.nearest_markets", { defaultValue: "Nearest Markets Near You" })}
                </Typography>
                {nearestMarkets.length ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {nearestMarkets.map((market) => (
                      <Chip
                        key={market.name}
                        label={`${market.name} | ${t("dashboard_page.mandi.km_away", {
                          defaultValue: "{{distance}} km",
                          distance: market.distanceKm.toFixed(0)
                        })}`}
                        clickable
                        color={mandiForm.market === market.name ? "secondary" : "default"}
                        onClick={() => setMandiForm((prev) => ({ ...prev, market: market.name }))}
                        sx={{ borderRadius: 999, fontWeight: 600 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    {t("dashboard_page.mandi.location_hint", {
                      defaultValue: "Enable location to auto-detect the nearest mandis."
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
                            borderRadius: 2.5,
                            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(21, 86, 45, 0.16)",
                            background: isDark
                              ? "linear-gradient(135deg, rgba(18, 46, 32, 0.98) 0%, rgba(12, 34, 24, 0.98) 100%)"
                              : "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(242, 249, 242, 0.98) 100%)",
                            boxShadow: isDark ? "0 16px 26px rgba(0,0,0,0.35)" : "0 16px 26px rgba(16, 66, 35, 0.12)"
                          }}
                        >
                          <CardContent>
                            <Stack spacing={1.2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
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
                                      distance: card.distanceKm.toFixed(0)
                                    })}
                                    sx={{ borderRadius: 999, fontWeight: 700 }}
                                  />
                                )}
                              </Stack>
                              <Stack direction="row" spacing={2} justifyContent="space-between">
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("dashboard_page.mandi.min_label", { defaultValue: "Min" })}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(card.min)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("dashboard_page.mandi.max_label", { defaultValue: "Max" })}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(card.max)}
                                  </Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("dashboard_page.mandi.modal_label", { defaultValue: "Modal" })}
                                  </Typography>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {formatCurrency(card.modal)}
                                  </Typography>
                                </Box>
                              </Stack>
                              <Stack direction="row" spacing={0.6} alignItems="center">
                                {trendUp ? (
                                  <TrendingUpIcon fontSize="small" sx={{ color: "success.main" }} />
                                ) : (
                                  <TrendingDownIcon fontSize="small" sx={{ color: "warning.main" }} />
                                )}
                                <Typography
                                  variant="body2"
                                  sx={{ color: trendUp ? "success.main" : "warning.main", fontWeight: 700 }}
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

              {mandiSummary && (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    size="small"
                    label={`${t("dashboard_page.mandi.latest_label", { defaultValue: "Latest" })} ${formatCurrency(
                      mandiSummary.latest
                    )}`}
                    sx={chipPillSx}
                  />
                  <Chip
                    size="small"
                    label={`${t("dashboard_page.mandi.min_label", { defaultValue: "Min" })} ${formatCurrency(
                      mandiSummary.min
                    )}`}
                    sx={chipPillSx}
                  />
                  <Chip
                    size="small"
                    label={`${t("dashboard_page.mandi.max_label", { defaultValue: "Max" })} ${formatCurrency(
                      mandiSummary.max
                    )}`}
                    sx={chipPillSx}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`${t("dashboard_page.mandi.source_label", { defaultValue: "Source" })}: ${mandiResult?.source || "stub"}`}
                  />
                  <Chip
                    size="small"
                    color={mandiSummary.changePct >= 0 ? "success" : "warning"}
                    label={`${t("dashboard_page.market_data.delta", { defaultValue: "Delta" })} ${mandiSummary.changePct.toFixed(2)}%`}
                  />
                </Stack>
              )}

              {mandiMutation.isError && (
                <Alert severity="error">
                  {mandiMutation.error instanceof Error ? mandiMutation.error.message : t("dashboard_page.mandi.load_error")}
                </Alert>
              )}
              {mandiResult?.stale_data_warning && <Alert severity="warning">{mandiResult.stale_data_warning}</Alert>}

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t("dashboard_page.mandi.price_trend", { defaultValue: "Price trend" })}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {[7, 15, 30].map((days) => (
                      <Chip
                        key={days}
                        label={`${days}d`}
                        clickable
                        variant={mandiForm.days === days ? "filled" : "outlined"}
                        color={mandiForm.days === days ? "secondary" : "default"}
                        onClick={() => setMandiForm((prev) => ({ ...prev, days }))}
                        size="small"
                        sx={{ borderRadius: 999 }}
                      />
                    ))}
                  </Stack>
                </Stack>
                {mandiChartData ? (
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isDark ? "rgba(12, 32, 22, 0.8)" : "rgba(255,255,255,0.8)",
                      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)"
                    }}
                  >
                    <Line data={mandiChartData} options={chartOptions} />
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard_page.mandi.empty")}
                  </Typography>
                )}
              </Box>

              {mandiChartData && (
                <>
                  <Button size="small" onClick={() => setShowMandiTable((prev) => !prev)}>
                    {showMandiTable
                      ? t("dashboard_page.market_data.hide_price_table", { defaultValue: "Hide price table" })
                      : t("dashboard_page.market_data.show_price_table", { defaultValue: "Show price table" })}
                  </Button>
                  {showMandiTable && (
                    <Table size="small" sx={{ mt: 1 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(27, 107, 58, 0.06)" }}>
                          <TableCell>{t("dashboard_page.tables.date")}</TableCell>
                          <TableCell>{t("dashboard_page.mandi.price_label")}</TableCell>
                          <TableCell>{t("dashboard_page.market_data.delta", { defaultValue: "Delta" })}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {mandiRowsWithChange.map((row) => (
                          <TableRow key={row.date}>
                            <TableCell>{row.date}</TableCell>
                            <TableCell>{row.price}</TableCell>
                            <TableCell sx={{ color: row.delta >= 0 ? "success.main" : "warning.main" }}>
                              {row.delta >= 0 ? "+" : ""}
                              {row.delta.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default React.memo(MarketDataSection);
