import React, { useState } from "react";
import { Card, CardContent, Grid, Stack, Typography, Button, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import { fetchMandiDirectory, MandiDirectoryFilters } from "../services/mandiDirectory";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";

const MarketDirectoryPage: React.FC = () => {
  const { t } = useTranslation();
  const mandiOptions = useMandiFilterOptions();
  const [filters, setFilters] = useState<MandiDirectoryFilters>({});
  const [applied, setApplied] = useState<MandiDirectoryFilters>({});
  const selectedState = filters.state?.trim() || "";
  const selectedDistrict = filters.district?.trim() || "";
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict) : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["mandi-directory", applied],
    queryFn: () => fetchMandiDirectory(applied)
  });

  const handleFilterChange = (key: keyof MandiDirectoryFilters, value: string) => {
    const nextValue = value.trim();
    setFilters((prev) => {
      const next: MandiDirectoryFilters = { ...prev, [key]: nextValue ? nextValue : undefined };
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
    key: keyof MandiDirectoryFilters;
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

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4">{t("market_directory_page.title", { defaultValue: "Market Profile Explorer" })}</Typography>
        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Grid container spacing={2}>
              {filterFields.map((field) => (
                <Grid item xs={12} sm={6} md={3} key={field.key}>
                  <FilterAutocomplete
                    label={field.label}
                    value={(filters as Record<string, string>)[field.key] || ""}
                    options={field.options}
                    disabled={field.disabled}
                    onChange={(value) => handleFilterChange(field.key, value)}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={3} display="flex" alignItems="center">
                <Button variant="contained" onClick={() => setApplied(filters)}>
                  {t("filters.search", { defaultValue: "Search" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {isLoading && <Typography>{t("market_directory_page.loading", { defaultValue: "Loading mandis..." })}</Typography>}
        {error && <Typography color="error">{t("common.request_failed")}</Typography>}

        <Grid container spacing={2}>
          {(data || []).map((mandi) => (
            <Grid item xs={12} md={6} lg={4} key={mandi.mandi_id}>
              <Card sx={{ height: "100%", border: "1px solid #ece0cf" }}>
                <CardContent>
                  <Typography variant="h6">{mandi.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {mandi.district || "-"}, {mandi.state}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    {(mandi.major_commodities || []).slice(0, 3).map((item) => (
                      <Chip key={item} label={item} size="small" />
                    ))}
                  </Stack>
                  {mandi.timings && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {t("market_directory_page.timings_label", { defaultValue: "Timings" })}: {mandi.timings}
                    </Typography>
                  )}
                  {mandi.transport_info && (
                    <Typography variant="body2" color="text.secondary">
                      {t("market_directory_page.transport_label", { defaultValue: "Transport" })}: {mandi.transport_info}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default MarketDirectoryPage;
