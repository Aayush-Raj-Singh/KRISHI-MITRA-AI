import React, { useState } from "react";
import { Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import { fetchMarketAlerts } from "../services/alerts";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import useLocalSuggestions from "../hooks/useLocalSuggestions";

interface MarketAlertsContentProps {
  embedded?: boolean;
}

export const MarketAlertsContent: React.FC<MarketAlertsContentProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const mandiOptions = useMandiFilterOptions();
  const [filters, setFilters] = useState<{ state?: string; district?: string; mandi?: string; commodity?: string }>({});
  const selectedStateValue = filters.state?.trim() || "";
  const selectedDistrictValue = filters.district?.trim() || "";
  const districtsForState = selectedStateValue ? mandiOptions.getDistrictsForState(selectedStateValue) : [];
  const mandisForDistrict =
    selectedStateValue && selectedDistrictValue
      ? mandiOptions.getMandisForDistrict(selectedStateValue, selectedDistrictValue)
      : [];
  const commoditySuggestions = useLocalSuggestions("market_alerts.commodity", mandiOptions.commodities);
  const [applied, setApplied] = useState<{ state?: string; district?: string; commodity?: string; mandi?: string }>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["market-alerts", applied],
    queryFn: () => fetchMarketAlerts(applied)
  });

  const handleApply = () => {
    if (filters.commodity) commoditySuggestions.addSuggestion(filters.commodity);
    setApplied(filters);
  };

  const handleFilterChange = (key: "state" | "district" | "mandi" | "commodity", value: string) => {
    const nextValue = value.trim();
    setFilters((prev) => {
      const next = { ...prev, [key]: nextValue ? nextValue : undefined };
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

  return (
    <Stack spacing={3}>
      <Typography variant={embedded ? "h5" : "h4"} sx={{ fontWeight: embedded ? 700 : 500 }}>
        {t("market_alerts_page.title", { defaultValue: "Market Alerts" })}
      </Typography>
        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FilterAutocomplete
                  label={t("filters.state", { defaultValue: "State" })}
                  value={filters.state || ""}
                  options={mandiOptions.states}
                  onChange={(value) => handleFilterChange("state", value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FilterAutocomplete
                  label={t("filters.district", { defaultValue: "District" })}
                  value={filters.district || ""}
                  options={districtsForState}
                  disabled={!selectedStateValue}
                  onChange={(value) => handleFilterChange("district", value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FilterAutocomplete
                  label={t("filters.mandi", { defaultValue: "Mandi" })}
                  value={filters.mandi || ""}
                  options={mandisForDistrict}
                  disabled={!selectedStateValue || !selectedDistrictValue}
                  onChange={(value) => handleFilterChange("mandi", value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FilterAutocomplete
                  label={t("filters.commodity", { defaultValue: "Commodity" })}
                  value={filters.commodity || ""}
                  options={commoditySuggestions.suggestions}
                  onChange={(value) => handleFilterChange("commodity", value)}
                />
              </Grid>
              <Grid item xs={12} md={3} display="flex" alignItems="center">
                <Button variant="contained" onClick={handleApply}>
                  {t("market_alerts_page.load_alerts", { defaultValue: "Load Alerts" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {isLoading && <Typography>{t("market_alerts_page.loading", { defaultValue: "Loading alerts..." })}</Typography>}
        {error && <Typography color="error">{t("common.request_failed")}</Typography>}
        <Grid container spacing={2}>
          {(data || []).map((alert) => (
            <Grid item xs={12} md={6} key={`${alert.date}-${alert.change_pct}`}>
              <Card sx={{ border: "1px solid #ece0cf" }}>
                <CardContent>
                  <Typography variant="subtitle1">{alert.date}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alert.note}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("market_alerts_page.change_label", { defaultValue: "Change" })}: {alert.change_pct}% ({alert.change_abs})
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
    </Stack>
  );
};

const MarketAlertsPage: React.FC = () => (
  <AppLayout>
    <MarketAlertsContent />
  </AppLayout>
);

export default MarketAlertsPage;
