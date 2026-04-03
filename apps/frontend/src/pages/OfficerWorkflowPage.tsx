import React, { useState } from "react";
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, Chip } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import {
  approveMandiEntry,
  createMandiEntry,
  fetchMandiEntries,
  rejectMandiEntry,
  submitMandiEntry,
} from "../services/mandiEntries";
import { useAppSelector } from "../store/hooks";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import useLocalSuggestions from "../hooks/useLocalSuggestions";

const OfficerWorkflowPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const isAdmin = userRole === "admin";
  const mandiOptions = useMandiFilterOptions();
  const [form, setForm] = useState({
    state: "",
    district: "",
    commodity: "",
    variety: "",
    grade: "",
    market: "",
    arrival_date: "",
    min_price: "",
    max_price: "",
    modal_price: "",
    arrivals_qtl: "",
  });
  const selectedState = form.state.trim();
  const selectedDistrict = form.district.trim();
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict
      ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict)
      : [];
  const commoditySuggestions = useLocalSuggestions(
    "mandi_entry.commodity",
    mandiOptions.commodities,
  );
  const varietySuggestions = useLocalSuggestions("mandi_entry.variety");
  const gradeSuggestions = useLocalSuggestions("mandi_entry.grade");

  const { data, isLoading } = useQuery({
    queryKey: ["mandi-entries"],
    queryFn: () => fetchMandiEntries({ limit: 50 }),
  });

  const handleCreate = async () => {
    commoditySuggestions.addSuggestion(form.commodity);
    varietySuggestions.addSuggestion(form.variety);
    gradeSuggestions.addSuggestion(form.grade);
    await createMandiEntry({
      ...form,
      min_price: Number(form.min_price),
      max_price: Number(form.max_price),
      modal_price: Number(form.modal_price),
      arrivals_qtl: Number(form.arrivals_qtl),
    });
    setForm({
      state: "",
      district: "",
      commodity: "",
      variety: "",
      grade: "",
      market: "",
      arrival_date: "",
      min_price: "",
      max_price: "",
      modal_price: "",
      arrivals_qtl: "",
    });
    await queryClient.invalidateQueries({ queryKey: ["mandi-entries"] });
  };

  const handleSubmit = async (entryId: string) => {
    await submitMandiEntry(entryId);
    await queryClient.invalidateQueries({ queryKey: ["mandi-entries"] });
  };

  const handleApprove = async (entryId: string) => {
    await approveMandiEntry(entryId);
    await queryClient.invalidateQueries({ queryKey: ["mandi-entries"] });
  };

  const handleReject = async (entryId: string) => {
    const reason =
      window.prompt(
        t("officer_workflow_page.rejection_reason", {
          defaultValue: "Rejection reason (optional)",
        }),
      ) || undefined;
    await rejectMandiEntry(entryId, reason);
    await queryClient.invalidateQueries({ queryKey: ["mandi-entries"] });
  };

  const statusLabel = (value: string) => t(`status.${value}`, { defaultValue: value });

  const handleFormChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "state" && prev.state !== value) {
        next.district = "";
        next.market = "";
      }
      if (key === "district" && prev.district !== value) {
        next.market = "";
      }
      return next;
    });
  };

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4">
          {t("officer_workflow_page.title", { defaultValue: "Officer Data Entry" })}
        </Typography>
        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("officer_workflow_page.create_entry", { defaultValue: "Create Mandi Entry" })}
            </Typography>
            <Grid container spacing={2}>
              {[
                {
                  key: "state",
                  label: t("filters.state", { defaultValue: "State" }),
                  options: mandiOptions.states,
                },
                {
                  key: "district",
                  label: t("filters.district", { defaultValue: "District" }),
                  options: districtsForState,
                  disabled: !selectedState,
                },
                {
                  key: "market",
                  label: t("filters.mandi", { defaultValue: "Mandi" }),
                  options: mandisForDistrict,
                  disabled: !selectedState || !selectedDistrict,
                },
                {
                  key: "commodity",
                  label: t("filters.commodity", { defaultValue: "Commodity" }),
                  options: commoditySuggestions.suggestions,
                },
                {
                  key: "variety",
                  label: t("filters.variety", { defaultValue: "Variety" }),
                  options: varietySuggestions.suggestions,
                },
                {
                  key: "grade",
                  label: t("filters.grade", { defaultValue: "Grade" }),
                  options: gradeSuggestions.suggestions,
                },
              ].map((field) => (
                <Grid item xs={12} sm={6} md={4} key={field.key}>
                  <FilterAutocomplete
                    label={field.label}
                    value={(form as Record<string, string>)[field.key]}
                    options={field.options}
                    disabled={field.disabled}
                    onChange={(value) => handleFormChange(field.key as keyof typeof form, value)}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label={t("officer_workflow_page.arrival_date", { defaultValue: "Arrival Date" })}
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={form.arrival_date}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, arrival_date: event.target.value }))
                  }
                />
              </Grid>
              {[
                {
                  key: "min_price",
                  label: t("officer_workflow_page.min_price", { defaultValue: "Min Price" }),
                },
                {
                  key: "max_price",
                  label: t("officer_workflow_page.max_price", { defaultValue: "Max Price" }),
                },
                {
                  key: "modal_price",
                  label: t("officer_workflow_page.modal_price", { defaultValue: "Modal Price" }),
                },
                {
                  key: "arrivals_qtl",
                  label: t("officer_workflow_page.arrivals_qtl", {
                    defaultValue: "Arrivals (qtl)",
                  }),
                },
              ].map((field) => (
                <Grid item xs={12} sm={6} md={3} key={field.key}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={(form as Record<string, string>)[field.key]}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                    }
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleCreate}>
                  {t("officer_workflow_page.save_draft", { defaultValue: "Save Draft" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Typography variant="h6">
          {t("officer_workflow_page.recent_entries", { defaultValue: "Recent Entries" })}
        </Typography>
        {isLoading && (
          <Typography>
            {t("officer_workflow_page.loading_entries", { defaultValue: "Loading entries..." })}
          </Typography>
        )}
        <Grid container spacing={2}>
          {data?.items.map((entry) => (
            <Grid item xs={12} md={6} key={entry._id}>
              <Card sx={{ border: "1px solid #ece0cf" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">{entry.market}</Typography>
                    <Chip label={statusLabel(entry.status)} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {entry.commodity} - {entry.arrival_date}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {t("officer_workflow_page.modal_label", { defaultValue: "Modal" })}:{" "}
                    {entry.modal_price} |{" "}
                    {t("officer_workflow_page.arrivals_label", { defaultValue: "Arrivals" })}:{" "}
                    {entry.arrivals_qtl} qtl
                  </Typography>
                  {entry.status === "draft" && (
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => handleSubmit(entry._id)}
                    >
                      {t("officer_workflow_page.submit_for_approval", {
                        defaultValue: "Submit for Approval",
                      })}
                    </Button>
                  )}
                  {entry.status === "submitted" && isAdmin && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleApprove(entry._id)}
                      >
                        {t("officer_workflow_page.approve", { defaultValue: "Approve" })}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleReject(entry._id)}
                      >
                        {t("officer_workflow_page.reject", { defaultValue: "Reject" })}
                      </Button>
                    </Stack>
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

export default OfficerWorkflowPage;
