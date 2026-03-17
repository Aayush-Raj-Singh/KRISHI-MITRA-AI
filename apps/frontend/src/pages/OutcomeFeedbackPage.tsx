import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import FeedbackIcon from "@mui/icons-material/Feedback";
import { useMutation } from "@tanstack/react-query";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { submitOutcomeFeedback, type OutcomeFeedbackResponse } from "../services/feedback";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const OutcomeFeedbackPage: React.FC = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    recommendation_id: "",
    rating: 4,
    yield_kg_per_acre: 2100,
    income_inr: 85000,
    water_usage_l_per_acre: 420000,
    fertilizer_kg_per_acre: 105,
    notes: ""
  });
  const [result, setResult] = useState<OutcomeFeedbackResponse | null>(null);
  const labels = useTranslatedStrings({
    trendLabel: "Trend",
    trendImproving: "Improving",
    trendDeclining: "Declining",
    trendStable: "Stable",
    trendNoHistory: "No history",
    regionTitle: "Regional comparison",
    waterVsRegion: "Water vs region",
    fertilizerVsRegion: "Fertilizer vs region",
    yieldVsRegion: "Yield vs region"
  });

  const mutation = useMutation({
    mutationFn: submitOutcomeFeedback,
    onSuccess: (data) => setResult(data)
  });

  const chartData = useMemo(() => {
    if (!result) return null;
    return {
      labels: [
        t("dashboard_page.sustainability_labels.water"),
        t("dashboard_page.sustainability_labels.fertilizer"),
        t("dashboard_page.sustainability_labels.yield")
      ],
      datasets: [
        {
          label: t("dashboard_page.sustainability_labels.score"),
          data: [
            result.sub_scores.water_efficiency,
            result.sub_scores.fertilizer_efficiency,
            result.sub_scores.yield_optimization
          ],
          backgroundColor: ["#1b6b3a", "#b65d2a", "#144a2c"]
        }
      ]
    };
  }, [result, t]);

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<FeedbackIcon color="primary" />}
          title={t("dashboard.feedback")}
          subtitle={t("dashboard_page.services.feedback_description")}
          badges={[
            t("dashboard_page.feedback.rating"),
            t("dashboard_page.feedback.yield_kg_per_acre"),
            t("dashboard.sustainability")
          ]}
          imageSrc="/assets/agri-slider/slide-09.jpg"
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.feedback.title")}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t("dashboard_page.feedback.recommendation_id")}
                    value={form.recommendation_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, recommendation_id: e.target.value }))}
                  />
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("dashboard_page.feedback.rating")}
                      type="number"
                      value={form.rating}
                      onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                      fullWidth
                    />
                    <TextField
                      label={t("dashboard_page.feedback.yield_kg_per_acre")}
                      type="number"
                      value={form.yield_kg_per_acre}
                      onChange={(e) => setForm((prev) => ({ ...prev, yield_kg_per_acre: Number(e.target.value) }))}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <TextField
                      label={t("dashboard_page.feedback.income_inr")}
                      type="number"
                      value={form.income_inr}
                      onChange={(e) => setForm((prev) => ({ ...prev, income_inr: Number(e.target.value) }))}
                      fullWidth
                    />
                    <TextField
                      label={t("dashboard_page.feedback.water_usage")}
                      type="number"
                      value={form.water_usage_l_per_acre}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, water_usage_l_per_acre: Number(e.target.value) }))
                      }
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    label={t("dashboard_page.feedback.fertilizer_kg_per_acre")}
                    type="number"
                    value={form.fertilizer_kg_per_acre}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fertilizer_kg_per_acre: Number(e.target.value) }))
                    }
                  />
                  <TextField
                    label={t("dashboard_page.feedback.notes")}
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                  <Button
                    variant="contained"
                    onClick={() =>
                      mutation.mutate({
                        ...form,
                        rating: Number(form.rating),
                        yield_kg_per_acre: Number(form.yield_kg_per_acre),
                        income_inr: Number(form.income_inr),
                        water_usage_l_per_acre: Number(form.water_usage_l_per_acre),
                        fertilizer_kg_per_acre: Number(form.fertilizer_kg_per_acre)
                      })
                    }
                    disabled={mutation.isPending}
                    startIcon={mutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
                  >
                    {mutation.isPending ? t("actions.submitting") : t("actions.submit")}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  {t("dashboard_page.feedback.sustainability_snapshot")}
                </Typography>
                {result ? (
                  <Stack spacing={2}>
                    <Typography variant="subtitle1">
                      {t("dashboard_page.feedback.overall_score")}: {result.sustainability_score}
                    </Typography>
                    {result.recognition_badge && (
                      <Chip label={result.recognition_badge} color="success" variant="outlined" />
                    )}
                    {result.trend && (
                      <Chip
                        label={`${labels.trendLabel}: ${
                          result.trend === "improving"
                            ? labels.trendImproving
                            : result.trend === "declining"
                              ? labels.trendDeclining
                              : result.trend === "stable"
                                ? labels.trendStable
                                : labels.trendNoHistory
                        }`}
                        color={
                          result.trend === "declining" ? "warning" : result.trend === "improving" ? "success" : "default"
                        }
                        variant="outlined"
                      />
                    )}
                    {chartData && <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
                    {result.regional_comparison && (
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2">{labels.regionTitle}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {labels.waterVsRegion}: {result.regional_comparison.water_vs_region_percent ?? 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {labels.fertilizerVsRegion}: {result.regional_comparison.fertilizer_vs_region_percent ?? 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {labels.yieldVsRegion}: {result.regional_comparison.yield_vs_region_percent ?? 0}%
                        </Typography>
                      </Stack>
                    )}
                    <Stack spacing={1}>
                      {result.recommendations.map((item) => (
                        <Typography key={item} variant="body2">
                          {item}
                        </Typography>
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {t("dashboard_page.feedback.empty")}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default OutcomeFeedbackPage;
