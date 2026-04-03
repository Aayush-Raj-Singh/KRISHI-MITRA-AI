import React, { useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import CampaignIcon from "@mui/icons-material/Campaign";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RadarIcon from "@mui/icons-material/Radar";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import useLocalSuggestions from "../hooks/useLocalSuggestions";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import { fetchMarketAlerts } from "../services/alerts";

interface MarketAlertsContentProps {
  embedded?: boolean;
}

const formatSignedNumber = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;

const MarketAlertsHeader: React.FC<{ embedded: boolean }> = ({ embedded }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!embedded) {
    return (
      <AgricultureHero
        icon={<NotificationsActiveIcon color="primary" />}
        logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
        title={t("market_alerts_page.title", { defaultValue: "Market Alerts" })}
        subtitle="A field-ready signal desk for sudden mandi shifts, dispatch planning, and commodity volatility alerts across your active trade corridors."
        badges={[
          "Price spike watch",
          "Mandi response lane",
          "Commodity-led risk signals",
          "Officer-ready briefings",
        ]}
        imageSrc="/assets/agri-slider/slide-05.jpg"
      />
    );
  }

  return (
    <Paper
      sx={{
        p: 2.3,
        borderRadius: 3,
        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(31,84,50,0.12)",
        background: isDark
          ? "linear-gradient(145deg, rgba(16,40,28,0.98) 0%, rgba(12,30,21,0.98) 100%)"
          : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(243,249,241,0.98) 100%)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Box>
          <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
            Alert command lane
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t("market_alerts_page.title", { defaultValue: "Market Alerts" })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, maxWidth: 680 }}>
            Surface abnormal price movement, mandi-side disruption, and sudden commodity shifts
            before they affect dispatch and sale timing.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="flex-start">
          <Chip label="Rapid response" sx={{ borderRadius: 999, fontWeight: 700 }} />
          <Chip label="District-aware" sx={{ borderRadius: 999, fontWeight: 700 }} />
          <Chip label="Live signal feed" sx={{ borderRadius: 999, fontWeight: 700 }} />
        </Stack>
      </Stack>
    </Paper>
  );
};

export const MarketAlertsContent: React.FC<MarketAlertsContentProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === "dark";
  const mandiOptions = useMandiFilterOptions();
  const [filters, setFilters] = useState<{
    state?: string;
    district?: string;
    mandi?: string;
    commodity?: string;
  }>({});
  const [applied, setApplied] = useState<{
    state?: string;
    district?: string;
    commodity?: string;
    mandi?: string;
  }>({});

  const selectedStateValue = filters.state?.trim() || "";
  const selectedDistrictValue = filters.district?.trim() || "";
  const districtsForState = selectedStateValue
    ? mandiOptions.getDistrictsForState(selectedStateValue)
    : [];
  const mandisForDistrict =
    selectedStateValue && selectedDistrictValue
      ? mandiOptions.getMandisForDistrict(selectedStateValue, selectedDistrictValue)
      : [];
  const commoditySuggestions = useLocalSuggestions(
    "market_alerts.commodity",
    mandiOptions.commodities,
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["market-alerts", applied],
    queryFn: () => fetchMarketAlerts(applied),
  });

  const alerts = data || [];
  const featuredAlert = useMemo(
    () => [...alerts].sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))[0] || null,
    [alerts],
  );
  const positiveAlerts = alerts.filter((alert) => alert.change_pct > 0).length;
  const negativeAlerts = alerts.filter((alert) => alert.change_pct < 0).length;
  const largestSwing = featuredAlert ? Math.abs(featuredAlert.change_pct) : 0;
  const appliedChips = Object.entries(applied).filter(([, value]) => Boolean(value));

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

  const alertTone = (changePct: number) => {
    if (changePct >= 4)
      return { chip: "success" as const, accent: "#1f6d45", label: "Strong upward move" };
    if (changePct > 0)
      return { chip: "success" as const, accent: "#588157", label: "Rising market" };
    if (changePct <= -4)
      return { chip: "warning" as const, accent: "#9b3d20", label: "Sharp correction" };
    return { chip: "warning" as const, accent: "#b76d2c", label: "Softening market" };
  };

  return (
    <Stack spacing={3}>
      <MarketAlertsHeader embedded={embedded} />

      <Grid container spacing={2.2}>
        {[
          {
            label: "Signals in view",
            value: alerts.length,
            accent: "#1f6d45",
            icon: <RadarIcon />,
          },
          {
            label: "Positive alerts",
            value: positiveAlerts,
            accent: "#2f7d4c",
            icon: <AutoGraphIcon />,
          },
          {
            label: "Correction alerts",
            value: negativeAlerts,
            accent: "#a44a16",
            icon: <WarningAmberIcon />,
          },
          {
            label: "Largest swing",
            value: `${largestSwing.toFixed(1)}%`,
            accent: "#446f95",
            icon: <CampaignIcon />,
          },
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 3,
                border: `1px solid ${alpha(stat.accent, 0.16)}`,
                background: isDark
                  ? `linear-gradient(145deg, ${alpha(stat.accent, 0.16)} 0%, rgba(13, 28, 18, 0.92) 100%)`
                  : `linear-gradient(145deg, ${alpha(stat.accent, 0.08)} 0%, rgba(255,255,255,0.95) 100%)`,
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={1.4}>
                <Box>
                  <Typography variant="caption" sx={{ color: stat.accent, fontWeight: 800 }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.7, fontWeight: 800 }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(stat.accent, 0.14), color: stat.accent }}>
                  {stat.icon}
                </Avatar>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper
        sx={{
          p: { xs: 2.2, md: 2.8 },
          borderRadius: 3,
          border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(31,84,50,0.12)",
          background: isDark
            ? "linear-gradient(145deg, rgba(14,35,24,0.98) 0%, rgba(10,25,18,0.98) 100%)"
            : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={1.5}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Signal filters
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Narrow alerts by geography and commodity before reviewing movement notes and
                response actions.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {appliedChips.length > 0 ? (
                appliedChips.map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    sx={{ borderRadius: 999, fontWeight: 700 }}
                  />
                ))
              ) : (
                <Chip label="All markets" sx={{ borderRadius: 999, fontWeight: 700 }} />
              )}
            </Stack>
          </Stack>

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
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
            <Button variant="contained" onClick={handleApply} sx={{ fontWeight: 700 }}>
              {t("market_alerts_page.load_alerts", { defaultValue: "Load Alerts" })}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/services/market-intelligence?tab=arrivals")}
              sx={{ fontWeight: 700 }}
            >
              Open arrival view
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {isLoading && (
        <Alert severity="info">
          {t("market_alerts_page.loading", { defaultValue: "Loading alerts..." })}
        </Alert>
      )}
      {error && <Alert severity="error">{t("common.request_failed")}</Alert>}

      {featuredAlert && (
        <Paper
          sx={{
            p: { xs: 2.3, md: 2.8 },
            borderRadius: 3,
            border: "1px solid rgba(31,84,50,0.12)",
            background: isDark
              ? "linear-gradient(145deg, rgba(15,34,24,0.98) 0%, rgba(11,24,17,0.98) 100%)"
              : "linear-gradient(145deg, rgba(247,251,244,0.98) 0%, rgba(255,255,255,0.98) 100%)",
          }}
        >
          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={7.5}>
              <Stack spacing={1.2}>
                <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
                  Featured alert
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 800, fontSize: { xs: "1.7rem", md: "2.2rem" } }}
                >
                  {featuredAlert.note}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  The strongest visible shift in the current alert set. Use this as the first review
                  point for mandi routing and advisory messaging.
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip
                    size="small"
                    color={alertTone(featuredAlert.change_pct).chip}
                    label={`${formatSignedNumber(featuredAlert.change_pct)}%`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Delta ${formatSignedNumber(featuredAlert.change_abs)}`}
                  />
                  <Chip size="small" variant="outlined" label={featuredAlert.date} />
                </Stack>
              </Stack>
            </Grid>
            <Grid item xs={12} lg={4.5}>
              <Stack spacing={1.2}>
                <Paper
                  elevation={0}
                  sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#1f6d45", 0.08) }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Trading posture
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {alertTone(featuredAlert.change_pct).label}
                  </Typography>
                </Paper>
                <Paper
                  elevation={0}
                  sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#8f4c1a", 0.08) }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Suggested move
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Recheck nearby mandi arrivals and compare trend analytics before dispatch
                    confirmation.
                  </Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={2.4}>
        {alerts.map((alert) => {
          const tone = alertTone(alert.change_pct);
          return (
            <Grid item xs={12} md={6} key={`${alert.date}-${alert.change_pct}-${alert.note}`}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: `1px solid ${alpha(tone.accent, 0.16)}`,
                  background: isDark
                    ? `linear-gradient(145deg, ${alpha(tone.accent, 0.16)} 0%, rgba(12, 24, 17, 0.96) 100%)`
                    : `linear-gradient(145deg, ${alpha(tone.accent, 0.07)} 0%, rgba(255,255,255,0.98) 100%)`,
                }}
              >
                <CardContent sx={{ p: 2.35 }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1.5}
                      alignItems="flex-start"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {alert.note}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Monitor this movement against arrivals, district supply pressure, and
                          current farmer selling plans.
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: alpha(tone.accent, 0.12), color: tone.accent }}>
                        {alert.change_pct >= 0 ? <CampaignIcon /> : <WarningAmberIcon />}
                      </Avatar>
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      <Chip
                        size="small"
                        color={tone.chip}
                        label={`${formatSignedNumber(alert.change_pct)}%`}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Abs ${formatSignedNumber(alert.change_abs)}`}
                      />
                      <Chip size="small" variant="outlined" label={alert.date} />
                    </Stack>

                    <Paper
                      elevation={0}
                      sx={{ p: 1.4, borderRadius: 2.5, bgcolor: alpha(tone.accent, 0.08) }}
                    >
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <LocalShippingIcon sx={{ color: tone.accent }} fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {tone.label}
                        </Typography>
                      </Stack>
                    </Paper>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.1}>
                      <Button
                        variant="contained"
                        onClick={() => navigate("/services/market-intelligence?tab=trends")}
                        sx={{ fontWeight: 700 }}
                      >
                        Review trends
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => navigate("/mandi-directory")}
                        sx={{ fontWeight: 700 }}
                      >
                        Open mandi directory
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
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
