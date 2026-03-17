import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Grid,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import {
  fetchCommodities,
  createCommodity,
  fetchVarieties,
  createVariety,
  fetchGrades,
  createGrade,
  fetchUnits,
  createUnit,
  fetchSeasons,
  createSeason,
  fetchMspRates,
  createMspRate
} from "../services/masterData";

const AdminMasterDataPage: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0);
  const queryClient = useQueryClient();

  const commoditiesQuery = useQuery({ queryKey: ["commodities"], queryFn: fetchCommodities });
  const varietiesQuery = useQuery({ queryKey: ["varieties"], queryFn: () => fetchVarieties() });
  const gradesQuery = useQuery({ queryKey: ["grades"], queryFn: () => fetchGrades() });
  const unitsQuery = useQuery({ queryKey: ["units"], queryFn: fetchUnits });
  const seasonsQuery = useQuery({ queryKey: ["seasons"], queryFn: fetchSeasons });
  const mspQuery = useQuery({ queryKey: ["msp"], queryFn: () => fetchMspRates() });

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4">{t("admin_master_data_page.title", { defaultValue: "Admin Master Data" })}</Typography>
        <Tabs value={tab} onChange={(_, value) => setTab(value)}>
          <Tab label={t("admin_master_data_page.tabs.commodities", { defaultValue: "Commodities" })} />
          <Tab label={t("admin_master_data_page.tabs.varieties", { defaultValue: "Varieties" })} />
          <Tab label={t("admin_master_data_page.tabs.grades", { defaultValue: "Grades" })} />
          <Tab label={t("admin_master_data_page.tabs.units", { defaultValue: "Units" })} />
          <Tab label={t("admin_master_data_page.tabs.seasons", { defaultValue: "Seasons" })} />
          <Tab label={t("admin_master_data_page.tabs.msp", { defaultValue: "MSP" })} />
        </Tabs>

        {tab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                {t("admin_master_data_page.add_commodity", { defaultValue: "Add Commodity" })}
              </Typography>
              <MasterForm
                fields={[
                  { key: "name", label: t("admin_master_data_page.field_name", { defaultValue: "Name" }) },
                  { key: "code", label: t("admin_master_data_page.field_code", { defaultValue: "Code" }) },
                  {
                    key: "categories",
                    label: t("admin_master_data_page.field_categories", {
                      defaultValue: "Categories (comma separated)"
                    })
                  }
                ]}
                onSubmit={async (values) => {
                  await createCommodity({
                    name: values.name,
                    code: values.code,
                    categories: values.categories.split(",").map((item) => item.trim()).filter(Boolean),
                    active: true
                  });
                  handleRefresh();
                }}
              />
              <MasterTable
                title={t("admin_master_data_page.tabs.commodities", { defaultValue: "Commodities" })}
                rows={commoditiesQuery.data || []}
              />
            </CardContent>
          </Card>
        )}

        {tab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                {t("admin_master_data_page.add_variety", { defaultValue: "Add Variety" })}
              </Typography>
              <MasterForm
                fields={[
                  {
                    key: "commodity_id",
                    label: t("admin_master_data_page.field_commodity_id", { defaultValue: "Commodity ID" })
                  },
                  { key: "name", label: t("admin_master_data_page.field_name", { defaultValue: "Name" }) },
                  { key: "code", label: t("admin_master_data_page.field_code", { defaultValue: "Code" }) }
                ]}
                onSubmit={async (values) => {
                  await createVariety({
                    commodity_id: values.commodity_id || "",
                    name: values.name || "",
                    code: values.code || "",
                    active: true
                  });
                  handleRefresh();
                }}
              />
              <MasterTable
                title={t("admin_master_data_page.tabs.varieties", { defaultValue: "Varieties" })}
                rows={varietiesQuery.data || []}
              />
            </CardContent>
          </Card>
        )}

        {tab === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                {t("admin_master_data_page.add_grade", { defaultValue: "Add Grade" })}
              </Typography>
              <MasterForm
                fields={[
                  {
                    key: "commodity_id",
                    label: t("admin_master_data_page.field_commodity_id", { defaultValue: "Commodity ID" })
                  },
                  { key: "name", label: t("admin_master_data_page.field_name", { defaultValue: "Name" }) },
                  { key: "code", label: t("admin_master_data_page.field_code", { defaultValue: "Code" }) }
                ]}
                onSubmit={async (values) => {
                  await createGrade({
                    commodity_id: values.commodity_id || "",
                    name: values.name || "",
                    code: values.code || "",
                    active: true
                  });
                  handleRefresh();
                }}
              />
              <MasterTable
                title={t("admin_master_data_page.tabs.grades", { defaultValue: "Grades" })}
                rows={gradesQuery.data || []}
              />
            </CardContent>
          </Card>
        )}

        {tab === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                {t("admin_master_data_page.add_unit", { defaultValue: "Add Unit" })}
              </Typography>
              <MasterForm
                fields={[
                  { key: "name", label: t("admin_master_data_page.field_name", { defaultValue: "Name" }) },
                  { key: "symbol", label: t("admin_master_data_page.field_symbol", { defaultValue: "Symbol" }) },
                  { key: "type", label: t("admin_master_data_page.field_type", { defaultValue: "Type" }) }
                ]}
                onSubmit={async (values) => {
                  await createUnit({
                    name: values.name || "",
                    symbol: values.symbol || "",
                    type: values.type || ""
                  });
                  handleRefresh();
                }}
              />
              <MasterTable
                title={t("admin_master_data_page.tabs.units", { defaultValue: "Units" })}
                rows={unitsQuery.data || []}
              />
            </CardContent>
          </Card>
        )}

        {tab === 4 && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                {t("admin_master_data_page.add_season", { defaultValue: "Add Season" })}
              </Typography>
              <MasterForm
                fields={[
                  { key: "name", label: t("admin_master_data_page.field_name", { defaultValue: "Name" }) },
                  {
                    key: "start_month",
                    label: t("admin_master_data_page.field_start_month", { defaultValue: "Start Month" })
                  },
                  {
                    key: "end_month",
                    label: t("admin_master_data_page.field_end_month", { defaultValue: "End Month" })
                  }
                ]}
                onSubmit={async (values) => {
                  await createSeason({
                    name: values.name,
                    start_month: Number(values.start_month),
                    end_month: Number(values.end_month),
                    active: true
                  });
                  handleRefresh();
                }}
              />
              <MasterTable
                title={t("admin_master_data_page.tabs.seasons", { defaultValue: "Seasons" })}
                rows={seasonsQuery.data || []}
              />
            </CardContent>
          </Card>
        )}

        {tab === 5 && (
          <Card>
            <CardContent>
              <Typography variant="h6">
                {t("admin_master_data_page.add_msp_rate", { defaultValue: "Add MSP Rate" })}
              </Typography>
              <MasterForm
                fields={[
                  {
                    key: "commodity_id",
                    label: t("admin_master_data_page.field_commodity_id", { defaultValue: "Commodity ID" })
                  },
                  {
                    key: "variety_id",
                    label: t("admin_master_data_page.field_variety_id", { defaultValue: "Variety ID (optional)" })
                  },
                  { key: "season", label: t("admin_master_data_page.field_season", { defaultValue: "Season" }) },
                  {
                    key: "price_per_quintal",
                    label: t("admin_master_data_page.field_price_per_quintal", { defaultValue: "Price per Quintal" })
                  },
                  { key: "source", label: t("admin_master_data_page.field_source", { defaultValue: "Source" }) },
                  {
                    key: "effective_from",
                    label: t("admin_master_data_page.field_effective_from", {
                      defaultValue: "Effective From (YYYY-MM-DD)"
                    })
                  }
                ]}
                onSubmit={async (values) => {
                  await createMspRate({
                    commodity_id: values.commodity_id,
                    variety_id: values.variety_id || undefined,
                    season: values.season,
                    price_per_quintal: Number(values.price_per_quintal),
                    source: values.source || undefined,
                    effective_from: values.effective_from || undefined
                  });
                  handleRefresh();
                }}
              />
              <MasterTable
                title={t("admin_master_data_page.tabs.msp_rates", { defaultValue: "MSP Rates" })}
                rows={mspQuery.data || []}
              />
            </CardContent>
          </Card>
        )}
      </Stack>
    </AppLayout>
  );
};

const MasterForm: React.FC<{
  fields: { key: string; label: string }[];
  onSubmit: (values: Record<string, string>) => Promise<void>;
}> = ({ fields, onSubmit }) => {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(values);
      setValues({});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={2} sx={{ my: 2 }}>
      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field.key}>
            <TextField
              fullWidth
              label={field.label}
              value={values[field.key] || ""}
              onChange={(event) => setValues((prev) => ({ ...prev, [field.key]: event.target.value }))}
            />
          </Grid>
        ))}
      </Grid>
      <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
        {submitting
          ? t("actions.saving", { defaultValue: "Saving..." })
          : t("actions.save", { defaultValue: "Save" })}
      </Button>
    </Stack>
  );
};

const MasterTable: React.FC<{ title: string; rows: unknown[] }> = ({ title, rows }) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant="subtitle1">{title}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("admin_master_data_page.table_name", { defaultValue: "Name" })}</TableCell>
            <TableCell>{t("admin_master_data_page.table_details", { defaultValue: "Code/Details" })}</TableCell>
            <TableCell>{t("admin_master_data_page.table_status", { defaultValue: "Status" })}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rows || []).map((row: any) => (
            <TableRow key={row._id || row.id || row.name}>
              <TableCell>{row.name || row.season || row.market || row.commodity_id}</TableCell>
              <TableCell>{row.code || row.symbol || row.price_per_quintal || "-"}</TableCell>
              <TableCell>
                {row.active === false
                  ? t("status.inactive", { defaultValue: "Inactive" })
                  : t("status.active", { defaultValue: "Active" })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
};

export default AdminMasterDataPage;
