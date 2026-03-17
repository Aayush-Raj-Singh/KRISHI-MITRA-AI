import React from "react";
import { Box, Button, Chip, Grid, Paper, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import NatureIcon from "@mui/icons-material/Nature";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";

import { spacingScale } from "../constants";
import KpiCard from "../KpiCard";

type Translate = (key: string, options?: Record<string, unknown>) => string;

interface HeroOverviewSectionProps {
  t: Translate;
  onNavigateCrop: () => void;
  onNavigatePrice: () => void;
  onNavigateWater: () => void;
  onNavigateAdvisory: () => void;
  onOpenOnboarding: () => void;
  onboardingStartLabel: string;
  wsUrl?: string;
  wsStatus: string;
  isOffline: boolean;
  latestRecommendation: string;
  waterSavingsValue: string;
  sustainabilityValue: string;
}

const HeroOverviewSection: React.FC<HeroOverviewSectionProps> = ({
  t,
  onNavigateCrop,
  onNavigatePrice,
  onNavigateWater,
  onNavigateAdvisory,
  onOpenOnboarding,
  onboardingStartLabel,
  wsUrl,
  wsStatus,
  isOffline,
  latestRecommendation,
  waterSavingsValue,
  sustainabilityValue
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Paper
      id="home"
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: spacingScale.sm, md: spacingScale.md },
        border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e7ddcc",
        background: isDark
          ? "linear-gradient(135deg, rgba(16, 40, 28, 0.98) 0%, rgba(12, 32, 22, 0.96) 55%, rgba(14, 36, 26, 0.94) 100%)"
          : "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,238,226,0.96) 55%, rgba(231, 244, 235, 0.94) 100%)",
        boxShadow: isDark ? "0 18px 36px rgba(0,0,0,0.35)" : "0 18px 36px rgba(20, 40, 24, 0.12)"
      }}
    >
      <Box
        sx={{
          position: "absolute",
          right: { xs: -140, md: -120 },
          top: { xs: -140, md: -120 },
          width: { xs: 260, md: 320 },
          height: { xs: 260, md: 320 },
          borderRadius: "50%",
          background: isDark
            ? `radial-gradient(circle, ${alpha(theme.palette.success.light, 0.16)} 0%, ${alpha(
                theme.palette.success.light,
                0.04
              )} 60%, rgba(27, 107, 58, 0) 100%)`
            : "radial-gradient(circle, rgba(27, 107, 58, 0.18) 0%, rgba(27, 107, 58, 0.04) 60%, rgba(27, 107, 58, 0) 100%)"
        }}
      />
      <Grid container spacing={spacingScale.md} alignItems="center">
        <Grid item xs={12} md={7}>
          <Stack spacing={spacingScale.sm}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.2rem", md: "3.15rem" },
                lineHeight: 1.08,
                fontFamily: '"Prata", serif',
                letterSpacing: 0.2
              }}
            >
              {t("dashboard_page.hero.title")}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560 }}>
              {t("dashboard_page.hero.description")}
            </Typography>
            <Stack direction="row" spacing={spacingScale.sm} flexWrap="wrap">
              <Button variant="contained" onClick={onNavigateCrop} size="large">
                {t("dashboard.crop")}
              </Button>
              <Button variant="outlined" color="secondary" onClick={onNavigatePrice} size="large">
                {t("dashboard.price")}
              </Button>
              <Button variant="outlined" onClick={onNavigateWater} size="large">
                {t("dashboard.water")}
              </Button>
              <Button variant="text" onClick={onNavigateAdvisory} size="large">
                {t("advisory.title")}
              </Button>
              <Button variant="outlined" startIcon={<AutoAwesomeIcon />} onClick={onOpenOnboarding} size="large">
                {onboardingStartLabel}
              </Button>
            </Stack>
            <Stack direction="row" spacing={spacingScale.xs} flexWrap="wrap">
              {wsUrl && (
                <Chip
                  label={`${t("dashboard_page.live_updates")}: ${t(`dashboard_page.ws_status.${wsStatus}`, {
                    defaultValue: wsStatus
                  })}`}
                  color={wsStatus === "open" ? "success" : "default"}
                />
              )}
              {isOffline && <Chip label={t("dashboard_page.offline_mode")} color="warning" />}
            </Stack>
          </Stack>
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <KpiCard
                  label={t("dashboard_page.kpi.status")}
                  value={isOffline ? t("dashboard_page.kpi.offline") : t("dashboard_page.kpi.online")}
                  icon={isOffline ? <WifiOffIcon color="warning" /> : <WifiIcon color="success" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KpiCard
                  label={t("dashboard.latest_rec")}
                  value={latestRecommendation}
                  icon={<AgricultureIcon color="primary" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KpiCard
                  label={t("dashboard_page.kpi.water_savings")}
                  value={waterSavingsValue}
                  icon={<WaterDropIcon color="primary" />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <KpiCard
                  label={t("dashboard.sustainability")}
                  value={sustainabilityValue}
                  icon={<NatureIcon color="success" />}
                />
              </Grid>
            </Grid>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default HeroOverviewSection;
