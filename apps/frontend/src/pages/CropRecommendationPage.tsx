import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import QuickRatingCard from "../components/feedback/QuickRatingCard";
import { fetchCropRecommendation, type CropRecommendationResponse } from "../services/recommendations";
import { getCachedWithMeta } from "../services/cache";
import { useOnlineStatus } from "../utils/useOnlineStatus";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

interface CropRecommendationContentProps {
  embedded?: boolean;
}

export const CropRecommendationContent: React.FC<CropRecommendationContentProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const [cropForm, setCropForm] = useState({
    soil_n: 60,
    soil_p: 40,
    soil_k: 35,
    soil_ph: 6.8,
    temperature_c: 27,
    humidity_pct: 65,
    rainfall_mm: 110,
    location: "Nashik",
    season: "kharif",
    historical_yield: 2.2
  });
  const [result, setResult] = useState<CropRecommendationResponse | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: fetchCropRecommendation,
    onSuccess: (data) => {
      setResult(data);
      try {
        localStorage.setItem("krishimitra:last_crop_payload", JSON.stringify(cropForm));
      } catch {
      }
    }
  });

  const cacheKey = useMemo(() => `crop:${JSON.stringify(cropForm)}`, [cropForm]);
  const offlineLabels = useTranslatedStrings(
    {
      offlineTitle: "Offline mode",
      offlineBody: "Showing the last saved recommendation until you are online.",
      loadCached: "Load last saved result",
      lastUpdated: "Last updated"
    },
    true
  );

  useEffect(() => {
    const cached = getCachedWithMeta<CropRecommendationResponse>(cacheKey);
    if (cached) {
      setCachedAt(cached.ts);
    }
  }, [cacheKey, result]);

  const handleLoadCached = () => {
    try {
      const raw = localStorage.getItem("krishimitra:last_crop_payload");
      if (!raw) return;
      const payload = JSON.parse(raw) as typeof cropForm;
      setCropForm(payload);
      const cached = getCachedWithMeta<CropRecommendationResponse>(`crop:${JSON.stringify(payload)}`);
      if (cached) {
        setResult(cached.value);
        setCachedAt(cached.ts);
      }
    } catch {
    }
  };

  return (
    <Stack spacing={3}>
      {embedded ? (
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {t("dashboard.crop")}
        </Typography>
      ) : (
        <AgricultureHero
          icon={<AgricultureIcon color="primary" />}
          title={t("dashboard.crop")}
          subtitle={t("dashboard_page.services.crop_description")}
          badges={[
            t("dashboard_page.crop.soil_n"),
            t("dashboard_page.crop.soil_ph"),
            t("dashboard_page.crop.historical_yield")
          ]}
          imageSrc="/assets/agri-slider/slide-01.png"
        />
      )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.crop.inputs_title")}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t("dashboard_page.crop.soil_n")}
                    type="number"
                    value={cropForm.soil_n}
                    onChange={(e) => setCropForm({ ...cropForm, soil_n: Number(e.target.value) })}
                    helperText={t("dashboard_page.crop.soil_n_helper")}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("dashboard_page.crop.soil_p")}
                      type="number"
                      value={cropForm.soil_p}
                      onChange={(e) => setCropForm({ ...cropForm, soil_p: Number(e.target.value) })}
                      fullWidth
                    />
                    <TextField
                      label={t("dashboard_page.crop.soil_k")}
                      type="number"
                      value={cropForm.soil_k}
                      onChange={(e) => setCropForm({ ...cropForm, soil_k: Number(e.target.value) })}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label={t("dashboard_page.crop.soil_ph")}
                    type="number"
                    value={cropForm.soil_ph}
                    onChange={(e) => setCropForm({ ...cropForm, soil_ph: Number(e.target.value) })}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("dashboard_page.crop.temperature_c")}
                      type="number"
                      value={cropForm.temperature_c}
                      onChange={(e) => setCropForm({ ...cropForm, temperature_c: Number(e.target.value) })}
                      fullWidth
                    />
                    <TextField
                      label={t("dashboard_page.crop.humidity_pct")}
                      type="number"
                      value={cropForm.humidity_pct}
                      onChange={(e) => setCropForm({ ...cropForm, humidity_pct: Number(e.target.value) })}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label={t("dashboard_page.crop.rainfall_mm")}
                    type="number"
                    value={cropForm.rainfall_mm}
                    onChange={(e) => setCropForm({ ...cropForm, rainfall_mm: Number(e.target.value) })}
                  />
                  <TextField
                    label={t("dashboard_page.forms.location")}
                    value={cropForm.location}
                    onChange={(e) => setCropForm({ ...cropForm, location: e.target.value })}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("dashboard_page.crop.season")}
                      value={cropForm.season}
                      onChange={(e) => setCropForm({ ...cropForm, season: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label={t("dashboard_page.crop.historical_yield")}
                      type="number"
                      value={cropForm.historical_yield}
                      onChange={(e) => setCropForm({ ...cropForm, historical_yield: Number(e.target.value) })}
                      fullWidth
                    />
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={() => mutation.mutate(cropForm)}
                    disabled={mutation.isPending}
                    startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {mutation.isPending ? t("actions.analyzing") : t("actions.generate")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.crop.recommendations")}
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
                {result ? (
                  <Stack spacing={2}>
                    {result.recommendations.map((item) => (
                      <Box key={item.crop}>
                        <Typography variant="subtitle1">
                          {item.crop} ({Math.round(item.confidence * 100)}%)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.explanation}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                      </Box>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard_page.crop.empty")}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {result?.recommendation_id && (
          <QuickRatingCard recommendationId={result.recommendation_id} service="crop" />
        )}
    </Stack>
  );
};

const CropRecommendationPage: React.FC = () => (
  <AppLayout>
    <CropRecommendationContent />
  </AppLayout>
);

export default CropRecommendationPage;
