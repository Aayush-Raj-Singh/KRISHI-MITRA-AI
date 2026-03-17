import React, { useMemo, useState } from "react";
import { Card, CardContent, Grid, Stack, TextField, Typography, Button, List, ListItem } from "@mui/material";
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
  Legend
} from "chart.js";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import { fetchTrendAnalytics, TrendFilters } from "../services/trends";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface TrendAnalyticsContentProps {
  embedded?: boolean;
}

export const TrendAnalyticsContent: React.FC<TrendAnalyticsContentProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const mandiOptions = useMandiFilterOptions();
  const [draftFilters, setDraftFilters] = useState<TrendFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<TrendFilters>({});
  const selectedState = draftFilters.state?.trim() || "";
  const selectedDistrict = draftFilters.district?.trim() || "";
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict) : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["trend-analytics", appliedFilters],
    queryFn: () => fetchTrendAnalytics(appliedFilters)
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

  const filterFields: Array<{
    key: keyof TrendFilters;
    label: string;
    options: string[];
    disabled?: boolean;
  }> = [
    { label: t("filters.state", { defaultValue: "State" }), key: "state", options: mandiOptions.states },
    {
      label: t("filters.district", { defaultValue: "District" }),
      key: "district",
      options: districtsForState,
      disabled: !selectedState
    },
    {
      label: t("filters.mandi", { defaultValue: "Mandi" }),
      key: "mandi",
      options: mandisForDistrict,
      disabled: !selectedState || !selectedDistrict
    },
    { label: t("filters.commodity", { defaultValue: "Commodity" }), key: "commodity", options: mandiOptions.commodities }
  ];

  const windowCharts = useMemo(() => {
    if (!data) return [];
    return data.windows.map((window) => ({
      window,
      chartData: {
        labels: window.points.map((point) => point.date),
        datasets: [
          {
            label: t("trend_analytics_page.avg_price_label", {
              defaultValue: "{{days}}-day Avg Price",
              days: window.window_days
            }),
            data: window.points.map((point) => point.avg_price),
            borderColor: "#1b6b3a",
            backgroundColor: "rgba(27, 107, 58, 0.2)"
          }
        ]
      }
    }));
  }, [data, t]);

  const seasonalChartData = useMemo(() => {
    if (!data) return null;
    return {
      labels: data.seasonal.map((item) => item.season),
      datasets: [
        {
          label: t("trend_analytics_page.seasonal_avg_price", { defaultValue: "Seasonal Avg Price" }),
          data: data.seasonal.map((item) => item.average_price),
          backgroundColor: "rgba(216, 132, 45, 0.6)"
        }
      ]
    };
  }, [data, t]);

  return (
    <Stack spacing={3}>
      <Typography variant={embedded ? "h5" : "h4"} sx={{ fontWeight: embedded ? 700 : 500 }}>
        {t("trend_analytics_page.title", { defaultValue: "Historical Trend Analytics" })}
      </Typography>

        <Card sx={{ border: "1px solid #e4dccd" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("filters.title", { defaultValue: "Filters" })}
            </Typography>
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
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, date_from: event.target.value || undefined }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t("filters.to_date", { defaultValue: "To date" })}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={draftFilters.date_to || ""}
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, date_to: event.target.value || undefined }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
                <Button variant="contained" onClick={handleApply}>
                  {t("filters.apply", { defaultValue: "Apply" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {isLoading && (
          <Typography>{t("trend_analytics_page.loading", { defaultValue: "Loading trend analytics..." })}</Typography>
        )}
        {error && <Typography color="error">{t("common.request_failed")}</Typography>}

        {data && (
          <Grid container spacing={3}>
            {windowCharts.map((item) => (
              <Grid item xs={12} md={4} key={item.window.window_days}>
                <Card sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    {t("trend_analytics_page.window_trend_title", {
                      defaultValue: "{{days}}-Day Trend (Change {{change}}%)",
                      days: item.window.window_days,
                      change: item.window.change_pct
                    })}
                  </Typography>
                  <Line data={item.chartData} />
                  <Typography variant="caption" color="text.secondary">
                    {t("trend_analytics_page.volatility", { defaultValue: "Volatility" })}: {item.window.volatility}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {data && seasonalChartData && (
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t("trend_analytics_page.seasonal_comparison", { defaultValue: "Seasonal Comparison" })}
            </Typography>
            <Bar data={seasonalChartData} />
          </Card>
        )}

        {data && (
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {t("trend_analytics_page.price_spike_alerts", { defaultValue: "Price Spike Alerts" })}
            </Typography>
            {data.alerts.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("trend_analytics_page.no_spike_alerts", { defaultValue: "No spike alerts detected." })}
              </Typography>
            ) : (
              <List>
                {data.alerts.map((alert) => (
                  <ListItem key={`${alert.date}-${alert.change_pct}`}>
                    <Typography variant="body2">
                      {alert.date}: {alert.note} ({alert.change_pct}%)
                    </Typography>
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
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
