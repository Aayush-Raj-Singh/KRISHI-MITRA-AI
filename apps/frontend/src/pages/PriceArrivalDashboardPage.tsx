import React, { useMemo, useState } from "react";
import { Button, Card, CardContent, Grid, Stack, TextField, Typography } from "@mui/material";
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
  Legend
} from "chart.js";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import { fetchPriceArrivalDashboard, PriceArrivalFilters } from "../services/dashboard";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import useLocalSuggestions from "../hooks/useLocalSuggestions";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface PriceArrivalDashboardContentProps {
  embedded?: boolean;
}

export const PriceArrivalDashboardContent: React.FC<PriceArrivalDashboardContentProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const mandiOptions = useMandiFilterOptions();
  const varietySuggestions = useLocalSuggestions("price_arrival.variety");
  const gradeSuggestions = useLocalSuggestions("price_arrival.grade");
  const [draftFilters, setDraftFilters] = useState<PriceArrivalFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<PriceArrivalFilters>({});
  const selectedState = draftFilters.state?.trim() || "";
  const selectedDistrict = draftFilters.district?.trim() || "";
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict) : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["price-arrival", appliedFilters],
    queryFn: () => fetchPriceArrivalDashboard(appliedFilters)
  });

  const series = data?.series || [];

  const priceChartData = useMemo(
    () => ({
      labels: series.map((item) => item.date),
      datasets: [
        {
          label: t("price_arrival_page.average_price", { defaultValue: "Average Price" }),
          data: series.map((item) => item.avg_price),
          borderColor: "#1b6b3a",
          backgroundColor: "rgba(27, 107, 58, 0.2)"
        },
        {
          label: t("price_arrival_page.modal_price_label", { defaultValue: "Modal Price" }),
          data: series.map((item) => item.modal_price),
          borderColor: "#d8842d",
          backgroundColor: "rgba(216, 132, 45, 0.2)"
        }
      ]
    }),
    [series, t]
  );

  const arrivalsChartData = useMemo(
    () => ({
      labels: series.map((item) => item.date),
      datasets: [
        {
          label: t("price_arrival_page.arrivals_qtl", { defaultValue: "Arrivals (qtl)" }),
          data: series.map((item) => item.arrivals_qtl),
          backgroundColor: "rgba(27, 107, 58, 0.5)"
        }
      ]
    }),
    [series, t]
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

  const filterFields: Array<{
    key: keyof PriceArrivalFilters & string;
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
    { label: t("filters.commodity", { defaultValue: "Commodity" }), key: "commodity", options: mandiOptions.commodities },
    { label: t("filters.variety", { defaultValue: "Variety" }), key: "variety", options: varietySuggestions.suggestions },
    { label: t("filters.grade", { defaultValue: "Grade" }), key: "grade", options: gradeSuggestions.suggestions }
  ];

  return (
    <Stack spacing={3}>
      <Typography variant={embedded ? "h5" : "h4"} sx={{ fontWeight: embedded ? 700 : 500 }}>
        {t("price_arrival_page.title", { defaultValue: "Price + Arrival Intelligence" })}
      </Typography>
        <Card sx={{ border: "1px solid #e4dccd" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("filters.title", { defaultValue: "Filters" })}
            </Typography>
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
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, date_from: event.target.value || undefined }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t("filters.to_date", { defaultValue: "To date" })}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={draftFilters.date_to || ""}
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, date_to: event.target.value || undefined }))}
                />
              </Grid>
              <Grid item xs={12} md={4} display="flex" alignItems="center">
                <Button variant="contained" onClick={handleApply}>
                  {t("filters.apply_filters", { defaultValue: "Apply Filters" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {isLoading && <Typography>{t("price_arrival_page.loading", { defaultValue: "Loading dashboard..." })}</Typography>}
        {error && <Typography color="error">{t("common.request_failed")}</Typography>}

        {data && (
          <Grid container spacing={2}>
            {[
              { label: t("price_arrival_page.avg_price", { defaultValue: "Avg Price" }), value: data.summary.average_price },
              { label: t("price_arrival_page.modal_price", { defaultValue: "Modal Price" }), value: data.summary.modal_price },
              { label: t("price_arrival_page.price_spread", { defaultValue: "Price Spread" }), value: data.summary.price_spread },
              {
                label: t("price_arrival_page.total_arrivals", { defaultValue: "Total Arrivals (qtl)" }),
                value: data.summary.total_arrivals_qtl
              }
            ].map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.label}>
                <Card sx={{ border: "1px solid #e7ddcc" }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h6">{card.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {data && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t("price_arrival_page.price_trend", { defaultValue: "Price Trend" })}
                </Typography>
                <Line data={priceChartData} />
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {t("price_arrival_page.arrivals_trend", { defaultValue: "Arrivals Trend" })}
                </Typography>
                <Bar data={arrivalsChartData} />
              </Card>
            </Grid>
          </Grid>
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
