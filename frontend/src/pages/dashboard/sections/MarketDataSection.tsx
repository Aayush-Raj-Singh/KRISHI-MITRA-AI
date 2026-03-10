import React from "react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ChartData } from "chart.js";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { Line } from "react-chartjs-2";

import type {
  MandiPricePoint,
  MandiPriceResponse,
  WeatherResponse
} from "../../../services/integrations";

type MandiAutocompleteProps = {
  options: string[];
  value: string;
  onChange: (event: React.SyntheticEvent, value: string | null) => void;
  freeSolo?: boolean;
  onInputChange: (event: React.SyntheticEvent, value: string) => void;
  renderInput: (params: Record<string, unknown>) => React.ReactNode;
  fullWidth?: boolean;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;
const MandiAutocomplete = Autocomplete as unknown as React.ComponentType<MandiAutocompleteProps>;

interface WeatherSummary {
  avgRain: number;
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
}

interface MandiFormValues {
  crop: string;
  market: string;
  days: number;
}

interface MarketDataSectionProps {
  t: Translate;
  weatherLocation: string;
  setWeatherLocation: React.Dispatch<React.SetStateAction<string>>;
  weatherDays: number;
  setWeatherDays: React.Dispatch<React.SetStateAction<number>>;
  weatherMutation: UseMutationResult<WeatherResponse, unknown, { location: string; days: number }, unknown>;
  weatherResult: WeatherResponse | null;
  weatherSummary: WeatherSummary | null;
  weatherView: "table" | "chart";
  setWeatherView: React.Dispatch<React.SetStateAction<"table" | "chart">>;
  weatherChartData: ChartData<"line", number[], string> | null;
  mandiCategory: string;
  setMandiCategory: React.Dispatch<React.SetStateAction<string>>;
  mandiCategoryOptions: string[];
  filteredMandiCrops: string[];
  mandiForm: MandiFormValues;
  setMandiForm: React.Dispatch<React.SetStateAction<MandiFormValues>>;
  mandiMarkets: string[];
  mandiMutation: UseMutationResult<
    MandiPriceResponse,
    unknown,
    { crop: string; market: string; days: number },
    unknown
  >;
  mandiSummary: { latest: number; min: number; max: number; changePct: number } | null;
  mandiResult: MandiPriceResponse | null;
  mandiChartData: ChartData<"line", number[], string> | null;
  showMandiTable: boolean;
  setShowMandiTable: React.Dispatch<React.SetStateAction<boolean>>;
  mandiRowsWithChange: Array<MandiPricePoint & { delta: number }>;
}

const MarketDataSection: React.FC<MarketDataSectionProps> = ({
  t,
  weatherLocation,
  setWeatherLocation,
  weatherDays,
  setWeatherDays,
  weatherMutation,
  weatherResult,
  weatherSummary,
  weatherView,
  setWeatherView,
  weatherChartData,
  mandiCategory,
  setMandiCategory,
  mandiCategoryOptions,
  filteredMandiCrops,
  mandiForm,
  setMandiForm,
  mandiMarkets,
  mandiMutation,
  mandiSummary,
  mandiResult,
  mandiChartData,
  showMandiTable,
  setShowMandiTable,
  mandiRowsWithChange
}) => (
  <Grid container spacing={3} id="market-data">
    <Grid item xs={12} md={6} id="weather-section">
      <Card sx={{ border: "1px solid #e6dcc9", overflow: "hidden" }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <WaterDropIcon color="primary" />
            <Typography variant="h6">{t("dashboard_page.weather.title")}</Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 1.5 }}>
            <TextField
              label={t("dashboard_page.forms.location")}
              value={weatherLocation}
              onChange={(event) => setWeatherLocation(event.target.value)}
              fullWidth
            />
            <TextField
              label={t("dashboard_page.forms.days")}
              type="number"
              inputProps={{ min: 1, max: 14 }}
              value={weatherDays}
              onChange={(event) => setWeatherDays(Number(event.target.value))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() => weatherMutation.mutate({ location: weatherLocation, days: weatherDays })}
              disabled={weatherMutation.isPending}
            >
              {weatherMutation.isPending ? t("actions.loading") : t("actions.fetch")}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {[5, 7, 10, 14].map((days) => (
              <Chip
                key={days}
                label={`${days} days`}
                clickable
                color={weatherDays === days ? "primary" : "default"}
                onClick={() => setWeatherDays(days)}
                sx={{ mb: 1 }}
              />
            ))}
            {weatherSummary && (
              <>
                <Chip size="small" label={`Avg Rain ${weatherSummary.avgRain.toFixed(1)} mm`} sx={{ mb: 1 }} />
                <Chip size="small" label={`Avg Temp ${weatherSummary.avgTemp.toFixed(1)} C`} sx={{ mb: 1 }} />
              </>
            )}
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Forecast insights
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={weatherView}
              onChange={(_, value) => {
                if (value) setWeatherView(value);
              }}
            >
              <ToggleButton value="table">Table</ToggleButton>
              <ToggleButton value="chart">Chart</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          {weatherMutation.isError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {weatherMutation.error instanceof Error
                ? weatherMutation.error.message
                : t("dashboard_page.weather.load_error")}
            </Alert>
          )}
          {weatherResult?.stale_data_warning && (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              {weatherResult.stale_data_warning}
            </Alert>
          )}
          {weatherResult ? (
            weatherView === "table" ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("dashboard_page.tables.date")}</TableCell>
                    <TableCell>{t("dashboard_page.tables.rainfall_mm")}</TableCell>
                    <TableCell>{t("dashboard_page.tables.temp_c")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weatherResult.forecast.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell>{day.date}</TableCell>
                      <TableCell>{day.rainfall_mm}</TableCell>
                      <TableCell>{day.temperature_c}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : weatherChartData ? (
              <Line
                data={weatherChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "bottom" } },
                  scales: {
                    y: { position: "left", title: { display: true, text: "Rainfall (mm)" } },
                    y1: {
                      position: "right",
                      grid: { drawOnChartArea: false },
                      title: { display: true, text: "Temp (C)" }
                    }
                  }
                }}
              />
            ) : null
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("dashboard_page.weather.empty", { days: weatherDays })}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
    <Grid item xs={12} md={6} id="mandi-section">
      <Card sx={{ border: "1px solid #e6dcc9", overflow: "hidden" }}>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <ShowChartIcon color="secondary" />
            <Typography variant="h6">{t("dashboard_page.mandi.title")}</Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 1.5 }}>
            <TextField
              select
              label="Category"
              value={mandiCategory}
              onChange={(event) => setMandiCategory(String(event.target.value))}
              fullWidth
            >
              {mandiCategoryOptions.map((category) => (
                <MenuItem key={category} value={category}>
                  {category === "all" ? "All" : category}
                </MenuItem>
              ))}
            </TextField>
            <MandiAutocomplete
              options={filteredMandiCrops}
              value={mandiForm.crop}
              onChange={(_, value) => {
                if (value) {
                  setMandiForm((prev) => ({ ...prev, crop: value }));
                }
              }}
              freeSolo
              onInputChange={(_, value) => setMandiForm((prev) => ({ ...prev, crop: value }))}
              renderInput={(params) => <TextField {...params} label={t("dashboard_page.forms.crop")} fullWidth />}
              fullWidth
            />
            <MandiAutocomplete
              options={mandiMarkets}
              value={mandiForm.market}
              onChange={(_, value) => {
                if (value) {
                  setMandiForm((prev) => ({ ...prev, market: value }));
                }
              }}
              freeSolo
              onInputChange={(_, value) => setMandiForm((prev) => ({ ...prev, market: value }))}
              renderInput={(params) => <TextField {...params} label={t("dashboard_page.forms.market")} fullWidth />}
              fullWidth
            />
            <TextField
              label={t("dashboard_page.forms.days")}
              type="number"
              inputProps={{ min: 1, max: 30 }}
              value={mandiForm.days}
              onChange={(event) => setMandiForm((prev) => ({ ...prev, days: Number(event.target.value) }))}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={() =>
                mandiMutation.mutate({
                  ...mandiForm,
                  crop: mandiForm.crop.trim(),
                  market: mandiForm.market.trim()
                })
              }
              disabled={mandiMutation.isPending}
            >
              {mandiMutation.isPending ? t("actions.loading") : t("actions.fetch")}
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
            {mandiCategoryOptions.slice(1, 8).map((category) => (
              <Chip
                key={category}
                label={category}
                clickable
                color={mandiCategory === category ? "primary" : "default"}
                onClick={() => setMandiCategory(category)}
                sx={{ mb: 1 }}
              />
            ))}
            <Chip
              size="small"
              variant="outlined"
              label={`${filteredMandiCrops.length} crops`}
              sx={{ mb: 1 }}
            />
            {[7, 15, 30].map((days) => (
              <Chip
                key={days}
                label={`${days}d`}
                clickable
                variant={mandiForm.days === days ? "filled" : "outlined"}
                color={mandiForm.days === days ? "secondary" : "default"}
                onClick={() => setMandiForm((prev) => ({ ...prev, days }))}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
          {mandiSummary && (
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
              <Chip size="small" label={`Latest ${mandiSummary.latest.toFixed(1)}`} />
              <Chip size="small" label={`Min ${mandiSummary.min.toFixed(1)}`} />
              <Chip size="small" label={`Max ${mandiSummary.max.toFixed(1)}`} />
              <Chip size="small" variant="outlined" label={`Source: ${mandiResult?.source || "stub"}`} />
              <Chip
                size="small"
                color={mandiSummary.changePct >= 0 ? "success" : "warning"}
                label={`Delta ${mandiSummary.changePct.toFixed(2)}%`}
              />
            </Stack>
          )}
          {mandiMutation.isError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {mandiMutation.error instanceof Error ? mandiMutation.error.message : t("dashboard_page.mandi.load_error")}
            </Alert>
          )}
          {mandiResult?.stale_data_warning && (
            <Alert severity="warning" sx={{ mb: 1.5 }}>
              {mandiResult.stale_data_warning}
            </Alert>
          )}
          {mandiChartData ? (
            <>
              <Line
                data={mandiChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
                  interaction: { mode: "nearest", intersect: false }
                }}
              />
              <Button size="small" sx={{ mt: 1 }} onClick={() => setShowMandiTable((prev) => !prev)}>
                {showMandiTable ? "Hide price table" : "Show price table"}
              </Button>
              {showMandiTable && (
                <Table size="small" sx={{ mt: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("dashboard_page.tables.date")}</TableCell>
                      <TableCell>{t("dashboard_page.mandi.price_label")}</TableCell>
                      <TableCell>Delta</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mandiRowsWithChange.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.price}</TableCell>
                        <TableCell sx={{ color: row.delta >= 0 ? "success.main" : "warning.main" }}>
                          {row.delta >= 0 ? "+" : ""}
                          {row.delta.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("dashboard_page.mandi.empty")}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Grid>
  </Grid>
);

export default MarketDataSection;
