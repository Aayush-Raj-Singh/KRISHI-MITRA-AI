import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "@mui/material";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useMutation } from "@tanstack/react-query";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import QuickRatingCard from "../components/feedback/QuickRatingCard";
import { fetchPriceForecast, type PriceForecastResponse } from "../services/recommendations";
import { getCachedWithMeta } from "../services/cache";
import { useOnlineStatus } from "../utils/useOnlineStatus";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

type ActualEntry = {
  date: string;
  actual: number;
  predicted?: number | null;
  error?: number | null;
  createdAt: string;
};

const PriceForecastPage: React.FC = () => {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [form, setForm] = useState({
    crop: "rice",
    market: "Pune",
    currency: "INR"
  });
  const [horizon, setHorizon] = useState(30);
  const [result, setResult] = useState<PriceForecastResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [actualDate, setActualDate] = useState("");
  const [actualPrice, setActualPrice] = useState("");
  const [actualEntries, setActualEntries] = useState<ActualEntry[]>([]);
  const [actualError, setActualError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: fetchPriceForecast,
    onSuccess: (data) => {
      setResult(data);
      try {
        localStorage.setItem("krishimitra:last_price_payload", JSON.stringify(form));
      } catch {
        // ignore storage errors
      }
    }
  });

  const cacheKey = useMemo(() => `price:${JSON.stringify(form)}`, [form]);
  const actualStorageKey = useMemo(
    () => `krishimitra:price_actuals:${form.crop}:${form.market}`,
    [form.crop, form.market]
  );
  const translated = useTranslatedStrings({
    historical: "Historical",
    offlineTitle: "Offline mode",
    offlineBody: "Showing the last saved forecast until you are online.",
    loadCached: "Load last saved result",
    lastUpdated: "Last updated",
    actualsTitle: "Actual vs predicted",
    actualsSubtitle: "Track accuracy when new market prices arrive.",
    actualDate: "Actual date",
    actualPrice: "Actual price",
    recordActual: "Record actual",
    actualTableDate: "Date",
    actualTableActual: "Actual",
    actualTablePredicted: "Predicted",
    actualTableError: "Error",
    accuracyTitle: "Accuracy snapshot",
    noActuals: "No actuals recorded yet.",
    errorNoForecast: "Generate a forecast before adding actuals.",
    errorInvalidInput: "Enter a valid date and actual price.",
    errorOutOfRange: "Selected date is outside the forecast horizon."
  });

  useEffect(() => {
    const cached = getCachedWithMeta<PriceForecastResponse>(cacheKey);
    if (cached) {
      setCachedAt(cached.ts);
    }
  }, [cacheKey, result]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(actualStorageKey);
      if (!raw) {
        setActualEntries([]);
        return;
      }
      const parsed = JSON.parse(raw) as ActualEntry[];
      setActualEntries(Array.isArray(parsed) ? parsed : []);
    } catch {
      setActualEntries([]);
    }
  }, [actualStorageKey]);

  const activeSeries = useMemo(() => {
    if (!result) return null;
    return result.series.find((item) => item.horizon_days === horizon) || result.series[0] || null;
  }, [result, horizon]);

  useEffect(() => {
    if (activeSeries && !actualDate) {
      setActualDate(activeSeries.dates[0] || "");
    }
  }, [activeSeries, actualDate]);

  const chartData = useMemo(() => {
    if (!result || !activeSeries) return null;
    const historical = result.historical;
    const historicalDates = historical?.dates ?? [];
    const historicalPrices = historical?.prices ?? [];
    const chartLabels = [...historicalDates, ...activeSeries.dates];
    const historicalData = [
      ...historicalPrices,
      ...Array(activeSeries.dates.length).fill(null)
    ];
    const forecastData = [
      ...Array(historicalDates.length).fill(null),
      ...activeSeries.forecast
    ];
    const lowerData = [
      ...Array(historicalDates.length).fill(null),
      ...activeSeries.lower
    ];
    const upperData = [
      ...Array(historicalDates.length).fill(null),
      ...activeSeries.upper
    ];

    return {
      labels: chartLabels,
      datasets: [
        {
          label: translated.historical,
          data: historicalData,
          borderColor: "#6f7f73",
          backgroundColor: "rgba(111, 127, 115, 0.18)",
          pointRadius: 1.8,
          tension: 0.28
        },
        {
          label: t("dashboard_page.chart.forecast"),
          data: forecastData,
          borderColor: "#1b6b3a",
          backgroundColor: "rgba(27, 107, 58, 0.2)",
          borderDash: [6, 4],
          pointRadius: 2.2
        },
        {
          label: t("dashboard_page.chart.lower"),
          data: lowerData,
          borderColor: "#8c2f1b",
          backgroundColor: "rgba(140, 47, 27, 0.12)",
          pointRadius: 1.8
        },
        {
          label: t("dashboard_page.chart.upper"),
          data: upperData,
          borderColor: "#144a2c",
          backgroundColor: "rgba(20, 74, 44, 0.12)",
          pointRadius: 1.8
        }
      ]
    };
  }, [result, activeSeries, t, translated.historical]);

  const handleLoadCached = () => {
    try {
      const raw = localStorage.getItem("krishimitra:last_price_payload");
      if (!raw) return;
      const payload = JSON.parse(raw) as typeof form;
      setForm(payload);
      const cached = getCachedWithMeta<PriceForecastResponse>(`price:${JSON.stringify(payload)}`);
      if (cached) {
        setResult(cached.value);
        setCachedAt(cached.ts);
      }
    } catch {
      // ignore parse errors
    }
  };

  const handleAddActual = () => {
    setActualError(null);
    if (!activeSeries) {
      setActualError(translated.errorNoForecast);
      return;
    }
    const trimmedDate = actualDate.trim();
    const actualValue = Number(actualPrice);
    if (!trimmedDate || !actualPrice.trim() || Number.isNaN(actualValue)) {
      setActualError(translated.errorInvalidInput);
      return;
    }
    const index = activeSeries.dates.indexOf(trimmedDate);
    if (index < 0) {
      setActualError(translated.errorOutOfRange);
      return;
    }
    const predicted = activeSeries.forecast[index];
    const error = actualValue - predicted;
    const entry: ActualEntry = {
      date: trimmedDate,
      actual: actualValue,
      predicted,
      error,
      createdAt: new Date().toISOString()
    };
    setActualEntries((prev) => {
      const next = [entry, ...prev.filter((item) => item.date !== trimmedDate)].slice(0, 24);
      try {
        localStorage.setItem(actualStorageKey, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
    setActualPrice("");
  };

  const accuracyMetrics = useMemo(() => {
    const withPred = actualEntries.filter((entry) => typeof entry.predicted === "number");
    if (!withPred.length) return null;
    const mae =
      withPred.reduce((acc, entry) => acc + Math.abs((entry.actual || 0) - (entry.predicted || 0)), 0) /
      withPred.length;
    const mapeData = withPred.reduce(
      (acc, entry) => {
        const actualValue = entry.actual || 0;
        if (!actualValue) return acc;
        return { sum: acc.sum + Math.abs(((entry.predicted || 0) - actualValue) / actualValue), count: acc.count + 1 };
      },
      { sum: 0, count: 0 }
    );
    const mape = mapeData.count ? (mapeData.sum / mapeData.count) * 100 : 0;
    return { mae, mape };
  }, [actualEntries]);

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<ShowChartIcon color="primary" />}
          title={t("dashboard.price")}
          subtitle={t("dashboard_page.services.price_description")}
          badges={[t("dashboard_page.price.horizon_30"), t("dashboard_page.price.horizon_60"), t("dashboard_page.price.horizon_90")]}
          imageSrc="/assets/agri-slider/slide-07.jpg"
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.price.inputs_title")}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t("dashboard_page.forms.crop")}
                    value={form.crop}
                    onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))}
                  />
                  <TextField
                    label={t("dashboard_page.forms.market")}
                    value={form.market}
                    onChange={(e) => setForm((prev) => ({ ...prev, market: e.target.value }))}
                  />
                  <TextField
                    label={t("dashboard_page.price.currency")}
                    value={form.currency}
                    onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                  />
                  <Button
                    variant="contained"
                    onClick={() => mutation.mutate(form)}
                    disabled={mutation.isPending}
                    startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {mutation.isPending ? t("actions.forecasting") : t("actions.generate")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1">{t("dashboard_page.price.title")}</Typography>
                  <Select size="small" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
                    <MenuItem value={30}>{t("dashboard_page.price.horizon_30")}</MenuItem>
                    <MenuItem value={60}>{t("dashboard_page.price.horizon_60")}</MenuItem>
                    <MenuItem value={90}>{t("dashboard_page.price.horizon_90")}</MenuItem>
                  </Select>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {!isOnline && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {translated.offlineTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {translated.offlineBody}
                    </Typography>
                    <Button variant="text" onClick={handleLoadCached} sx={{ px: 0 }}>
                      {translated.loadCached}
                    </Button>
                  </Box>
                )}
                {cachedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    {translated.lastUpdated}: {new Date(cachedAt).toLocaleString()}
                  </Typography>
                )}
                {chartData ? (
                  <Box>
                    <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: "bottom" } } }} />
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                      <Chip
                        label={`${t("dashboard_page.price.mape")}: ${(result?.mape ?? 0).toFixed(2)}%`}
                        size="small"
                      />
                      <Chip
                        label={`${t("dashboard_page.price.confidence_band")}: ${(result?.confidence_interval?.level ?? 0.8) * 100}%`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard_page.price.empty")}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1">{translated.actualsTitle}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {translated.actualsSubtitle}
                  </Typography>
                </Box>
                {accuracyMetrics && (
                  <Stack direction="row" spacing={1}>
                    <Chip label={`${translated.accuracyTitle}: MAE ${accuracyMetrics.mae.toFixed(2)}`} size="small" />
                    <Chip label={`MAPE ${accuracyMetrics.mape.toFixed(1)}%`} size="small" variant="outlined" />
                  </Stack>
                )}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <TextField
                  label={translated.actualDate}
                  type="date"
                  value={actualDate}
                  onChange={(event) => setActualDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 200 }}
                />
                <TextField
                  label={translated.actualPrice}
                  type="number"
                  value={actualPrice}
                  onChange={(event) => setActualPrice(event.target.value)}
                  sx={{ minWidth: 200 }}
                />
                <Button variant="outlined" onClick={handleAddActual} disabled={!actualDate || !actualPrice}>
                  {translated.recordActual}
                </Button>
              </Stack>

              {actualError && <Alert severity="warning">{actualError}</Alert>}

              {actualEntries.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{translated.actualTableDate}</TableCell>
                      <TableCell>{translated.actualTableActual}</TableCell>
                      <TableCell>{translated.actualTablePredicted}</TableCell>
                      <TableCell>{translated.actualTableError}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actualEntries.map((entry) => (
                      <TableRow key={entry.date}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.actual.toFixed(2)}</TableCell>
                        <TableCell>{entry.predicted?.toFixed(2) ?? "-"}</TableCell>
                        <TableCell>
                          {entry.error !== null && entry.error !== undefined ? entry.error.toFixed(2) : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {translated.noActuals}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        {result?.recommendation_id && (
          <QuickRatingCard recommendationId={result.recommendation_id} service="price" />
        )}
      </Stack>
    </AppLayout>
  );
};

export default PriceForecastPage;
