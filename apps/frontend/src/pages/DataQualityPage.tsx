import React, { useState } from "react";
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, Chip } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import { fetchDataQualityReport, fetchQualityIssues } from "../services/quality";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import useLocalSuggestions from "../hooks/useLocalSuggestions";

const DataQualityPage: React.FC = () => {
  const { t } = useTranslation();
  const mandiOptions = useMandiFilterOptions();
  const [draftFilters, setDraftFilters] = useState({
    state: "",
    district: "",
    mandi: "",
    commodity: "",
    date_from: "",
    date_to: ""
  });
  const selectedState = draftFilters.state.trim();
  const selectedDistrict = draftFilters.district.trim();
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict) : [];
  const commoditySuggestions = useLocalSuggestions("quality.commodity", mandiOptions.commodities);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  const reportQuery = useQuery({
    queryKey: ["quality-report", appliedFilters],
    queryFn: () => fetchDataQualityReport(appliedFilters)
  });

  const issuesQuery = useQuery({
    queryKey: ["quality-issues"],
    queryFn: fetchQualityIssues
  });

  const handleApply = () => {
    const filters: Record<string, string> = {};
    if (draftFilters.state) filters.state = draftFilters.state;
    if (draftFilters.district) filters.district = draftFilters.district;
    if (draftFilters.mandi) filters.mandi = draftFilters.mandi;
    if (draftFilters.commodity) filters.commodity = draftFilters.commodity;
    if (draftFilters.date_from) filters.date_from = draftFilters.date_from;
    if (draftFilters.date_to) filters.date_to = draftFilters.date_to;
    if (draftFilters.commodity) commoditySuggestions.addSuggestion(draftFilters.commodity);
    setAppliedFilters(filters);
  };

  const handleFilterChange = (key: string, value: string) => {
    setDraftFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "state" && prev.state !== value) {
        next.district = "";
        next.mandi = "";
      }
      if (key === "district" && prev.district !== value) {
        next.mandi = "";
      }
      return next;
    });
  };

  const summary = reportQuery.data?.summary;

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4">{t("quality.title", { defaultValue: "Data Quality Monitor" })}</Typography>

        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("quality.filters", { defaultValue: "Run validation checks" })}
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  key: "state",
                  label: t("filters.state", { defaultValue: "State" }),
                  options: mandiOptions.states
                },
                {
                  key: "district",
                  label: t("filters.district", { defaultValue: "District" }),
                  options: districtsForState,
                  disabled: !selectedState
                },
                {
                  key: "mandi",
                  label: t("filters.mandi", { defaultValue: "Mandi" }),
                  options: mandisForDistrict,
                  disabled: !selectedState || !selectedDistrict
                },
                {
                  key: "commodity",
                  label: t("quality.commodity", { defaultValue: "Commodity" }),
                  options: commoditySuggestions.suggestions
                }
              ].map((field) => (
                <Grid item xs={12} sm={6} md={3} key={field.key}>
                  <FilterAutocomplete
                    label={field.label}
                    value={(draftFilters as Record<string, string>)[field.key]}
                    options={field.options}
                    disabled={field.disabled}
                    onChange={(value) => handleFilterChange(field.key, value)}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t("quality.from_date", { defaultValue: "From date" })}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={draftFilters.date_from}
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, date_from: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t("quality.to_date", { defaultValue: "To date" })}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={draftFilters.date_to}
                  onChange={(event) => setDraftFilters((prev) => ({ ...prev, date_to: event.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={3} display="flex" alignItems="center">
                <Button variant="contained" onClick={handleApply}>
                  {t("quality.run_checks", { defaultValue: "Run Checks" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {reportQuery.isLoading && <Typography>{t("quality.loading", { defaultValue: "Running checks..." })}</Typography>}
        {reportQuery.error && (
          <Typography color="error">{String(reportQuery.error)}</Typography>
        )}

        {summary && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("quality.total_issues", { defaultValue: "Total issues" })}
                  </Typography>
                  <Typography variant="h5">{summary.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {t("quality.by_severity", { defaultValue: "By severity" })}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                    {Object.entries(summary.by_severity || {}).map(([level, count]) => (
                      <Chip key={level} label={`${level}: ${count}`} size="small" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {reportQuery.data?.issues && reportQuery.data.issues.length > 0 && (
          <Stack spacing={2}>
            <Typography variant="h6">{t("quality.latest_findings", { defaultValue: "Latest findings" })}</Typography>
            {reportQuery.data.issues.slice(0, 12).map((issue) => (
              <Card key={`${issue.issue_type}-${issue.entry_id}-${issue.detected_at}`} sx={{ border: "1px solid #ece0cf" }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={issue.severity} size="small" color={issue.severity === "high" ? "error" : "warning"} />
                    <Typography variant="subtitle2">{issue.issue_type}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {issue.message}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        <Stack spacing={2}>
          <Typography variant="h6">{t("quality.recent_issues", { defaultValue: "Recent issues" })}</Typography>
          <Grid container spacing={2}>
            {(issuesQuery.data || []).slice(0, 6).map((issue: any) => (
              <Grid item xs={12} md={6} key={issue._id}>
                <Card sx={{ border: "1px solid #ece0cf" }}>
                  <CardContent>
                    <Typography variant="subtitle2">{issue.issue_type}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {issue.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {issue.detected_at ? new Date(issue.detected_at).toLocaleString() : ""}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Stack>
    </AppLayout>
  );
};

export default DataQualityPage;
