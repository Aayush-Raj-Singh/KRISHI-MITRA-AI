import React, { Suspense, useMemo } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AirIcon from "@mui/icons-material/Air";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

import Footer from "../components/Footer";
import { HEADER_BADGES } from "../components/common/layoutPortalData";
import { useTheme } from "../hooks/useTheme";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

const FeatureCard = React.lazy(() => import("../components/FeatureCard"));

const LandingPage: React.FC = () => {
  const { t } = useTranslation();
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";
  const landingCopy = useTranslatedStrings(
    useMemo(
      () => ({
        featureCropTitle: "AI Crop Advisory",
        featureCropDescription: "Personalized crop recommendations and advisory workflows tailored to farm conditions.",
        featureMandiTitle: "Smart Mandi Price Intelligence",
        featureMandiDescription: "Live mandi prices, trends, and market insights for smarter selling decisions.",
        featureWeatherTitle: "Weather & AQI Insights",
        featureWeatherDescription: "Location-aware forecasts, AQI, and humidity updates for daily planning.",
        featureWaterTitle: "Water Optimization",
        featureWaterDescription: "Irrigation schedules and water-saving recommendations driven by AI models.",
        featureTrendTitle: "Market Trend Analytics",
        featureTrendDescription: "Price movement analytics and demand signals across key markets.",
        featureSchemeTitle: "Government Schemes",
        featureSchemeDescription: "Discover and track schemes and benefits relevant to your region.",
        platformFeatures: "Platform Features",
        platformFeaturesDescription:
          "A unified agriculture platform delivering intelligent advisory, market intelligence, and sustainability insights.",
        loadingFeatures: "Loading features...",
        toggleTheme: "Toggle theme"
      }),
      []
    )
  );
  const features = useMemo(
    () => [
      {
        title: landingCopy.featureCropTitle,
        description: landingCopy.featureCropDescription,
        icon: <AutoAwesomeIcon fontSize="small" />
      },
      {
        title: landingCopy.featureMandiTitle,
        description: landingCopy.featureMandiDescription,
        icon: <StorefrontIcon fontSize="small" />
      },
      {
        title: landingCopy.featureWeatherTitle,
        description: landingCopy.featureWeatherDescription,
        icon: <AirIcon fontSize="small" />
      },
      {
        title: landingCopy.featureWaterTitle,
        description: landingCopy.featureWaterDescription,
        icon: <WaterDropIcon fontSize="small" />
      },
      {
        title: landingCopy.featureTrendTitle,
        description: landingCopy.featureTrendDescription,
        icon: <ShowChartIcon fontSize="small" />
      },
      {
        title: landingCopy.featureSchemeTitle,
        description: landingCopy.featureSchemeDescription,
        icon: <AccountBalanceIcon fontSize="small" />
      }
    ],
    [landingCopy]
  );

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          backgroundImage: isDark
            ? "linear-gradient(rgba(9, 23, 15, 0.82), rgba(9, 23, 15, 0.82)), url('/assets/agri-slider/slide-06.jpg')"
            : "linear-gradient(rgba(13, 33, 22, 0.55), rgba(13, 33, 22, 0.55)), url('/assets/agri-slider/slide-06.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: "#fff"
        }}
      >
        <Container
          maxWidth={false}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: "min(100%, var(--app-shell-width))",
            maxWidth: "var(--app-shell-width)",
            px: "var(--app-shell-inline-pad) !important",
            py: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 2
          }}
        >
          <Button
            component={RouterLink}
            to="/"
            sx={{
              p: 0,
              minWidth: "auto",
              borderRadius: 2,
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" }
            }}
          >
            <Box
              component="img"
              src="/assets/logo/krishimitra-ai-icon-transparent.png"
              alt="KrishiMitra-AI logo"
              sx={{ height: 52, width: "auto" }}
            />
          </Button>
          <IconButton
            onClick={toggle}
            aria-label={landingCopy.toggleTheme}
            sx={{
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              bgcolor: "rgba(0,0,0,0.25)",
              "&:hover": { bgcolor: "rgba(0,0,0,0.4)" }
            }}
          >
            {isDark ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Container>

        <Container
          maxWidth={false}
          sx={{
            width: "min(100%, var(--app-shell-width-tight))",
            maxWidth: "var(--app-shell-width-tight)",
            px: "var(--app-shell-inline-pad) !important",
            textAlign: "center",
            zIndex: 1
          }}
        >
          <Stack spacing={2.5} alignItems="center">
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4rem" },
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase",
                maxWidth: "100%",
                overflowWrap: "anywhere"
              }}
            >
              {t("app.title")}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 500, maxWidth: "100%", overflowWrap: "anywhere" }}>
              {t("app.subtitle")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
              <Button
                variant="contained"
                color="success"
                component={RouterLink}
                to="/login"
                sx={{ minWidth: 160 }}
              >
                {t("auth.sign_in")}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                component={RouterLink}
                to="/register"
                sx={{
                  minWidth: 160,
                  borderColor: "rgba(255,255,255,0.65)",
                  color: "#fff",
                  "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.12)" }
                }}
              >
                {t("auth.sign_up")}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box id="features" sx={{ py: { xs: 6, md: 8 }, bgcolor: isDark ? "#0f2d1e" : "#f6fbf7" }}>
        <Container
          maxWidth={false}
          sx={{
            width: "min(100%, var(--app-shell-width))",
            maxWidth: "var(--app-shell-width)",
            px: "var(--app-shell-inline-pad) !important"
          }}
        >
          <Stack spacing={3}>
            <Stack spacing={1} alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {landingCopy.platformFeatures}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", maxWidth: 640 }}>
                {landingCopy.platformFeaturesDescription}
              </Typography>
            </Stack>
            <Suspense
              fallback={
                <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body2">{landingCopy.loadingFeatures}</Typography>
                </Box>
              }
            >
              <Grid container spacing={3}>
                {features.map((feature) => (
                  <Grid item key={feature.title} xs={12} sm={6} md={4}>
                    <FeatureCard {...feature} />
                  </Grid>
                ))}
              </Grid>
            </Suspense>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: { xs: 4, md: 5 }, bgcolor: isDark ? "#0b2117" : "#eef6ef" }}>
        <Container
          maxWidth={false}
          sx={{
            width: "min(100%, var(--app-shell-width-tight))",
            maxWidth: "var(--app-shell-width-tight)",
            px: "var(--app-shell-inline-pad) !important"
          }}
        >
          <Stack direction="row" spacing={3} alignItems="center" justifyContent="center" flexWrap="wrap">
            {HEADER_BADGES.map((badge) => (
              <Box
                key={badge.name}
                component="img"
                src={badge.logoSrc}
                alt={badge.name}
                sx={{ height: 56, width: "auto", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
              />
            ))}
          </Stack>
        </Container>
      </Box>

      <Box id="footer">
        <Footer />
      </Box>
    </Box>
  );
};

export default LandingPage;
