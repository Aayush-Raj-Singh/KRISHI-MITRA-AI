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
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { Bar } from "react-chartjs-2";

import type {
  AnalyticsFilters,
  AnalyticsReportFormat,
  AnalyticsOverview,
  FarmerAttentionItem,
  FeedbackReliabilityStats,
} from "../../../services/analytics";
import type {
  SchedulerOverviewResponse,
  TriggerOperationResponse,
} from "../../../services/operations";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface AnalyticsFilterFormValues {
  location: string;
  crop: string;
  farm_size_min: string;
  farm_size_max: string;
  from_date: string;
  to_date: string;
}

interface OfficerAnalyticsSectionProps {
  isOfficer: boolean;
  isAdmin: boolean;
  t: Translate;
  analyticsFilters: AnalyticsFilterFormValues;
  setAnalyticsFilters: React.Dispatch<React.SetStateAction<AnalyticsFilterFormValues>>;
  analyticsData: AnalyticsOverview | null;
  farmersNeedingAttention: FarmerAttentionItem[];
  feedbackReliability: FeedbackReliabilityStats | null;
  analyticsChartData: ChartData<"bar", number[], string> | null;
  handleAnalyticsFetch: () => void;
  handleAnalyticsExport: (format: AnalyticsReportFormat) => void;
  isExportingReport: boolean;
  exportingReportFormat: AnalyticsReportFormat | null;
  analyticsMutation: UseMutationResult<unknown, unknown, AnalyticsFilters, unknown>;
  operationsOverview: SchedulerOverviewResponse | null;
  operationsOverviewMutation: UseMutationResult<SchedulerOverviewResponse, unknown, void, unknown>;
  triggerWeeklyMutation: UseMutationResult<TriggerOperationResponse, unknown, boolean, unknown>;
  triggerQuarterlyMutation: UseMutationResult<TriggerOperationResponse, unknown, boolean, unknown>;
  triggerDailyDataMutation: UseMutationResult<TriggerOperationResponse, unknown, boolean, unknown>;
}

const operationStatusColor = (
  status: string,
): "default" | "success" | "error" | "warning" | "info" => {
  const normalized = status.toLowerCase();
  if (normalized === "success") return "success";
  if (normalized === "failed" || normalized === "error") return "error";
  if (normalized === "running") return "info";
  if (normalized === "queued" || normalized === "triggered") return "warning";
  return "default";
};

const OfficerAnalyticsSection: React.FC<OfficerAnalyticsSectionProps> = ({
  isOfficer,
  isAdmin,
  t,
  analyticsFilters,
  setAnalyticsFilters,
  analyticsData,
  farmersNeedingAttention,
  feedbackReliability,
  analyticsChartData,
  handleAnalyticsFetch,
  handleAnalyticsExport,
  isExportingReport,
  exportingReportFormat,
  analyticsMutation,
  operationsOverview,
  operationsOverviewMutation,
  triggerWeeklyMutation,
  triggerQuarterlyMutation,
  triggerDailyDataMutation,
}) => {
  if (!isOfficer) return null;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TipsAndUpdatesIcon color="primary" />
            <Typography variant="h6">{t("dashboard_page.analytics.title")}</Typography>
          </Stack>
          {isAdmin && (
            <Card
              variant="outlined"
              sx={{ borderColor: "rgba(27, 107, 58, 0.35)", bgcolor: "rgba(27, 107, 58, 0.04)" }}
            >
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Typography variant="subtitle1">
                      {t("dashboard_page.officer.operations_control", {
                        defaultValue: "Operations Control Panel",
                      })}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => operationsOverviewMutation.mutate()}
                        disabled={operationsOverviewMutation.isPending}
                      >
                        {operationsOverviewMutation.isPending
                          ? t("dashboard_page.officer.refreshing", {
                              defaultValue: "Refreshing...",
                            })
                          : t("dashboard_page.officer.refresh_runs", {
                              defaultValue: "Refresh Runs",
                            })}
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => triggerWeeklyMutation.mutate(true)}
                        disabled={
                          triggerWeeklyMutation.isPending ||
                          triggerQuarterlyMutation.isPending ||
                          triggerDailyDataMutation.isPending
                        }
                      >
                        {triggerWeeklyMutation.isPending
                          ? t("dashboard_page.officer.triggering", {
                              defaultValue: "Triggering...",
                            })
                          : t("dashboard_page.officer.run_weekly", {
                              defaultValue: "Run Weekly Job",
                            })}
                      </Button>
                      <Button
                        size="small"
                        color="secondary"
                        variant="contained"
                        onClick={() => triggerQuarterlyMutation.mutate(true)}
                        disabled={
                          triggerWeeklyMutation.isPending ||
                          triggerQuarterlyMutation.isPending ||
                          triggerDailyDataMutation.isPending
                        }
                      >
                        {triggerQuarterlyMutation.isPending
                          ? t("dashboard_page.officer.triggering", {
                              defaultValue: "Triggering...",
                            })
                          : t("dashboard_page.officer.run_quarterly", {
                              defaultValue: "Run Quarterly Job",
                            })}
                      </Button>
                      <Button
                        size="small"
                        color="success"
                        variant="contained"
                        onClick={() => triggerDailyDataMutation.mutate(true)}
                        disabled={
                          triggerWeeklyMutation.isPending ||
                          triggerQuarterlyMutation.isPending ||
                          triggerDailyDataMutation.isPending
                        }
                      >
                        {triggerDailyDataMutation.isPending
                          ? t("dashboard_page.officer.triggering", {
                              defaultValue: "Triggering...",
                            })
                          : t("dashboard_page.officer.run_daily_refresh", {
                              defaultValue: "Run Daily Data Refresh",
                            })}
                      </Button>
                    </Stack>
                  </Stack>

                  {(operationsOverviewMutation.isError ||
                    triggerWeeklyMutation.isError ||
                    triggerQuarterlyMutation.isError ||
                    triggerDailyDataMutation.isError) && (
                    <Alert severity="error">
                      {operationsOverviewMutation.error instanceof Error
                        ? operationsOverviewMutation.error.message
                        : triggerWeeklyMutation.error instanceof Error
                          ? triggerWeeklyMutation.error.message
                          : triggerQuarterlyMutation.error instanceof Error
                            ? triggerQuarterlyMutation.error.message
                            : triggerDailyDataMutation.error instanceof Error
                              ? triggerDailyDataMutation.error.message
                              : t("dashboard_page.officer.operations_load_error", {
                                  defaultValue: "Failed to load operation details.",
                                })}
                    </Alert>
                  )}

                  {operationsOverview && (
                    <>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {operationsOverview.hooks.map((hook) => (
                          <Chip
                            key={hook.key}
                            size="small"
                            variant="outlined"
                            label={`${hook.title} • ${hook.cadence}`}
                          />
                        ))}
                      </Stack>

                      <Divider />
                      <Typography variant="subtitle2">
                        {t("dashboard_page.officer.recent_runs", {
                          defaultValue: "Recent Operation Runs",
                        })}
                      </Typography>
                      <Stack spacing={1}>
                        {operationsOverview.recent_runs.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            {t("dashboard_page.officer.no_runs", {
                              defaultValue: "No operation runs yet.",
                            })}
                          </Typography>
                        ) : (
                          operationsOverview.recent_runs.slice(0, 6).map((run) => (
                            <Paper key={run.run_id} variant="outlined" sx={{ p: 1.25 }}>
                              <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={1}
                                alignItems={{ xs: "flex-start", sm: "center" }}
                                justifyContent="space-between"
                              >
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ textTransform: "capitalize" }}
                                  >
                                    {run.operation.replace(/_/g, " ")}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(run.triggered_at).toLocaleString()} •{" "}
                                    {t("dashboard_page.officer.triggered_by", {
                                      defaultValue: "by",
                                    })}{" "}
                                    {run.triggered_by}
                                  </Typography>
                                  {run.error && (
                                    <Typography
                                      variant="caption"
                                      color="error.main"
                                      sx={{ display: "block" }}
                                    >
                                      {run.error}
                                    </Typography>
                                  )}
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Chip
                                    size="small"
                                    color={operationStatusColor(run.status)}
                                    variant="outlined"
                                    label={run.status}
                                  />
                                  <Chip size="small" variant="outlined" label={run.mode} />
                                </Stack>
                              </Stack>
                            </Paper>
                          ))
                        )}
                      </Stack>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label={t("dashboard_page.analytics.location")}
                value={analyticsFilters.location}
                onChange={(event) =>
                  setAnalyticsFilters((prev) => ({ ...prev, location: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label={t("dashboard_page.forms.crop")}
                value={analyticsFilters.crop}
                onChange={(event) =>
                  setAnalyticsFilters((prev) => ({ ...prev, crop: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label={t("dashboard_page.analytics.farm_size_min")}
                type="number"
                value={analyticsFilters.farm_size_min}
                onChange={(event) =>
                  setAnalyticsFilters((prev) => ({ ...prev, farm_size_min: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label={t("dashboard_page.analytics.farm_size_max")}
                type="number"
                value={analyticsFilters.farm_size_max}
                onChange={(event) =>
                  setAnalyticsFilters((prev) => ({ ...prev, farm_size_max: event.target.value }))
                }
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label={t("dashboard_page.analytics.from_date")}
                type="date"
                value={analyticsFilters.from_date}
                onChange={(event) =>
                  setAnalyticsFilters((prev) => ({ ...prev, from_date: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label={t("dashboard_page.analytics.to_date")}
                type="date"
                value={analyticsFilters.to_date}
                onChange={(event) =>
                  setAnalyticsFilters((prev) => ({ ...prev, to_date: event.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={handleAnalyticsFetch}
              disabled={analyticsMutation.isPending}
            >
              {analyticsMutation.isPending
                ? t("actions.loading")
                : t("dashboard_page.analytics.generate")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleAnalyticsExport("pdf")}
              disabled={isExportingReport}
            >
              {isExportingReport && exportingReportFormat === "pdf"
                ? t("actions.loading")
                : t("dashboard_page.analytics.download_pdf")}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleAnalyticsExport("xlsx")}
              disabled={isExportingReport}
            >
              {isExportingReport && exportingReportFormat === "xlsx"
                ? t("actions.loading")
                : t("dashboard_page.analytics.download_excel")}
            </Button>
          </Stack>
          {analyticsMutation.isError && (
            <Alert severity="error">
              {analyticsMutation.error instanceof Error
                ? analyticsMutation.error.message
                : t("dashboard_page.analytics.load_error")}
            </Alert>
          )}

          {analyticsData && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">
                      {t("dashboard_page.analytics.total_farmers")}
                    </Typography>
                    <Typography variant="h5">{analyticsData.total_farmers}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard_page.analytics.feedback")}: {analyticsData.total_feedback}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">
                      {t("dashboard_page.analytics.avg_sustainability")}
                    </Typography>
                    <Typography variant="h5">{analyticsData.average_sustainability}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard_page.analytics.at_risk_farmers")}:{" "}
                      {analyticsData.at_risk_farmers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2">
                      {t("dashboard_page.analytics.avg_yield")}
                    </Typography>
                    <Typography variant="h5">{analyticsData.average_yield_kg_per_acre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("dashboard_page.analytics.water")}:{" "}
                      {analyticsData.average_water_usage_l_per_acre}{" "}
                      {t("dashboard_page.units.liter_per_acre")}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle1">
                        {t("dashboard_page.officer.feedback_reliability", {
                          defaultValue: "Feedback Reliability",
                        })}
                      </Typography>
                      {analyticsMutation.isPending && <CircularProgress size={18} />}
                    </Stack>
                    {feedbackReliability ? (
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            size="small"
                            label={t("dashboard_page.officer.avg_rating", {
                              defaultValue: "Avg rating {{value}}",
                              value: feedbackReliability.average_rating,
                            })}
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={t("dashboard_page.officer.negative_outcomes", {
                              defaultValue: "Negative outcomes {{value}}%",
                              value: feedbackReliability.negative_outcome_rate,
                            })}
                            color={
                              feedbackReliability.negative_outcome_rate > 30 ? "warning" : "success"
                            }
                            variant="outlined"
                          />
                          <Chip
                            size="small"
                            label={t("dashboard_page.officer.pending_reviews", {
                              defaultValue: "Pending expert reviews {{value}}",
                              value: feedbackReliability.expert_review_pending,
                            })}
                            color={
                              feedbackReliability.expert_review_pending > 0 ? "warning" : "default"
                            }
                            variant="outlined"
                          />
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {t("dashboard_page.officer.rating_distribution", {
                            defaultValue: "Rating distribution:",
                          })}{" "}
                          {Object.entries(feedbackReliability.rating_distribution)
                            .map(([star, count]) => `${star}★=${count}`)
                            .join(" | ")}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t("dashboard_page.officer.reliability_placeholder", {
                          defaultValue: "Generate analytics to view reliability statistics.",
                        })}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ borderColor: "rgba(183, 28, 28, 0.25)" }}>
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="subtitle1">
                        {t("dashboard_page.officer.farmers_needing_attention", {
                          defaultValue: "Farmers Needing Attention",
                        })}
                      </Typography>
                      {analyticsMutation.isPending && <CircularProgress size={18} />}
                    </Stack>
                    {farmersNeedingAttention.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("dashboard_page.officer.no_high_risk", {
                          defaultValue: "No high-risk farmers found for selected filters.",
                        })}
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {farmersNeedingAttention.slice(0, 5).map((farmer) => (
                          <Paper key={farmer.user_id} variant="outlined" sx={{ p: 1.25 }}>
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              spacing={1}
                              justifyContent="space-between"
                            >
                              <Box>
                                <Typography variant="subtitle2">
                                  {farmer.name} - {farmer.location}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {farmer.reasons.join(", ")}
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {farmer.is_masked && (
                                  <Chip
                                    size="small"
                                    label={t("dashboard_page.officer.consent_safe", {
                                      defaultValue: "Consent-safe view",
                                    })}
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                                <Chip
                                  size="small"
                                  label={t("dashboard_page.officer.risk_label", {
                                    defaultValue: "Risk {{value}}",
                                    value: farmer.risk_score,
                                  })}
                                  color="error"
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={t("dashboard_page.officer.sustainability_label", {
                                    defaultValue: "Sustainability {{value}}",
                                    value: farmer.sustainability_score,
                                  })}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={t("dashboard_page.officer.yield_trend_label", {
                                    defaultValue: "Yield trend {{value}}%",
                                    value: farmer.yield_trend_percent,
                                  })}
                                  variant="outlined"
                                />
                              </Stack>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      {t("dashboard_page.analytics.crop_adoption_trends")}
                    </Typography>
                    {analyticsChartData ? (
                      <Bar data={analyticsChartData} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t("dashboard_page.analytics.no_crop_trend")}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      {t("dashboard_page.analytics.resource_averages")}
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        {t("dashboard_page.analytics.fertilizer")}:{" "}
                        {analyticsData.average_fertilizer_kg_per_acre}{" "}
                        {t("dashboard_page.units.kg_per_acre")}
                      </Typography>
                      <Typography variant="body2">
                        {t("dashboard_page.analytics.water")}:{" "}
                        {analyticsData.average_water_usage_l_per_acre}{" "}
                        {t("dashboard_page.units.liter_per_acre")}
                      </Typography>
                      <Typography variant="body2">
                        {t("dashboard_page.analytics.yield")}:{" "}
                        {analyticsData.average_yield_kg_per_acre}{" "}
                        {t("dashboard_page.units.kg_per_acre")}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OfficerAnalyticsSection;
