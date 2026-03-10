import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import QuickRatingCard from "../components/feedback/QuickRatingCard";
import { fetchWaterOptimization, type WaterOptimizationResponse, type WeatherDay } from "../services/recommendations";
import { getCachedWithMeta } from "../services/cache";
import { useOnlineStatus } from "../utils/useOnlineStatus";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

const toISODate = (date: Date) => date.toISOString().split("T")[0];

const buildForecast = (days: number): WeatherDay[] => {
  const start = new Date();
  return Array.from({ length: days }).map((_, idx) => {
    const day = new Date(start);
    day.setDate(day.getDate() + idx + 1);
    return {
      date: toISODate(day),
      rainfall_mm: 2 + idx * 0.5,
      temperature_c: 28 + idx * 0.4
    };
  });
};

const WaterOptimizationPage: React.FC = () => {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [form, setForm] = useState({
    crop: "rice",
    growth_stage: "vegetative",
    soil_moisture_pct: 55,
    water_source: "canal",
    field_area_acres: 4
  });
  const [forecast, setForecast] = useState<WeatherDay[]>(() => buildForecast(5));
  const [result, setResult] = useState<WaterOptimizationResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: fetchWaterOptimization,
    onSuccess: (data) => {
      setResult(data);
      try {
        localStorage.setItem("krishimitra:last_water_payload", JSON.stringify({ ...form, forecast }));
      } catch {
        // ignore storage errors
      }
    }
  });

  const cacheKey = useMemo(() => `water:${JSON.stringify({ ...form, forecast })}`, [form, forecast]);
  const offlineLabels = useTranslatedStrings({
    offlineTitle: "Offline mode",
    offlineBody: "Showing the last saved schedule until you are online.",
    loadCached: "Load last saved result",
    lastUpdated: "Last updated"
  });

  useEffect(() => {
    const cached = getCachedWithMeta<WaterOptimizationResponse>(cacheKey);
    if (cached) {
      setCachedAt(cached.ts);
    }
  }, [cacheKey, result]);

  const handleLoadCached = () => {
    try {
      const raw = localStorage.getItem("krishimitra:last_water_payload");
      if (!raw) return;
      const payload = JSON.parse(raw) as typeof form & { forecast: WeatherDay[] };
      setForm({
        crop: payload.crop,
        growth_stage: payload.growth_stage,
        soil_moisture_pct: payload.soil_moisture_pct,
        water_source: payload.water_source,
        field_area_acres: payload.field_area_acres
      });
      setForecast(payload.forecast || buildForecast(5));
      const cached = getCachedWithMeta<WaterOptimizationResponse>(`water:${JSON.stringify(payload)}`);
      if (cached) {
        setResult(cached.value);
        setCachedAt(cached.ts);
      }
    } catch {
      // ignore parse errors
    }
  };

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<WaterDropIcon color="primary" />}
          title={t("dashboard.water")}
          subtitle={t("dashboard_page.services.water_description")}
          badges={[t("dashboard_page.water.growth_stage"), t("dashboard_page.water.soil_moisture_pct"), t("dashboard_page.kpi.water_savings")]}
          imageSrc="/assets/agri-slider/slide-08.jpg"
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.water.inputs_title")}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t("dashboard_page.forms.crop")}
                    value={form.crop}
                    onChange={(e) => setForm((prev) => ({ ...prev, crop: e.target.value }))}
                  />
                  <TextField
                    label={t("dashboard_page.water.growth_stage")}
                    value={form.growth_stage}
                    onChange={(e) => setForm((prev) => ({ ...prev, growth_stage: e.target.value }))}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("dashboard_page.water.soil_moisture_pct")}
                      type="number"
                      value={form.soil_moisture_pct}
                      onChange={(e) => setForm((prev) => ({ ...prev, soil_moisture_pct: Number(e.target.value) }))}
                      fullWidth
                    />
                    <TextField
                      label={t("dashboard_page.water.field_area_acres")}
                      type="number"
                      value={form.field_area_acres}
                      onChange={(e) => setForm((prev) => ({ ...prev, field_area_acres: Number(e.target.value) }))}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label={t("dashboard_page.water.water_source")}
                    value={form.water_source}
                    onChange={(e) => setForm((prev) => ({ ...prev, water_source: e.target.value }))}
                  />
                  <Button
                    variant="contained"
                    onClick={() => mutation.mutate({ ...form, forecast })}
                    disabled={mutation.isPending}
                    startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {mutation.isPending ? t("actions.optimizing") : t("actions.generate")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.water.forecast_schedule")}
                </Typography>
                {!isOnline && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {offlineLabels.offlineTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offlineLabels.offlineBody}
                    </Typography>
                    <Button variant="text" onClick={handleLoadCached} sx={{ px: 0 }}>
                      {offlineLabels.loadCached}
                    </Button>
                  </Box>
                )}
                {cachedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    {offlineLabels.lastUpdated}: {new Date(cachedAt).toLocaleString()}
                  </Typography>
                )}
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("dashboard_page.tables.date")}</TableCell>
                      <TableCell>{t("dashboard_page.tables.rainfall_mm")}</TableCell>
                      <TableCell>{t("dashboard_page.tables.temp_c")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forecast.map((day, index) => (
                      <TableRow key={day.date}>
                        <TableCell>{day.date}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={day.rainfall_mm}
                            onChange={(e) => {
                              const next = [...forecast];
                              next[index] = { ...day, rainfall_mm: Number(e.target.value) };
                              setForecast(next);
                            }}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={day.temperature_c}
                            onChange={(e) => {
                              const next = [...forecast];
                              next[index] = { ...day, temperature_c: Number(e.target.value) };
                              setForecast(next);
                            }}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {result && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2">
                      {t("dashboard_page.water.estimated_savings")}: {result.water_savings_percent}%
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("dashboard_page.tables.date")}</TableCell>
                          <TableCell>{t("dashboard_page.tables.irrigation_mm")}</TableCell>
                          <TableCell>{t("dashboard_page.tables.liters")}</TableCell>
                          <TableCell>{t("dashboard_page.tables.reason")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.schedule.map((item) => (
                          <TableRow key={item.date}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.irrigation_mm}</TableCell>
                            <TableCell>{item.irrigation_liters}</TableCell>
                            <TableCell>{item.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {result.notes.length > 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        {result.notes.join(" ")}
                      </Alert>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {result?.recommendation_id && (
          <QuickRatingCard recommendationId={result.recommendation_id} service="water" />
        )}
      </Stack>
    </AppLayout>
  );
};

export default WaterOptimizationPage;
