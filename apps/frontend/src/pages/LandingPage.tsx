import React, { Suspense } from "react";
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

const FeatureCard = React.lazy(() => import("../components/FeatureCard"));

const features = [
  {
    title: "AI Crop Advisory",
    description: "Personalized crop recommendations and advisory workflows tailored to farm conditions.",
    icon: <AutoAwesomeIcon fontSize="small" />
  },
  {
    title: "Smart Mandi Price Intelligence",
    description: "Live mandi prices, trends, and market insights for smarter selling decisions.",
    icon: <StorefrontIcon fontSize="small" />
  },
  {
    title: "Weather & AQI Insights",
    description: "Location-aware forecasts, AQI, and humidity updates for daily planning.",
    icon: <AirIcon fontSize="small" />
  },
  {
    title: "Water Optimization",
    description: "Irrigation schedules and water-saving recommendations driven by AI models.",
    icon: <WaterDropIcon fontSize="small" />
  },
  {
    title: "Market Trend Analytics",
    description: "Price movement analytics and demand signals across key markets.",
    icon: <ShowChartIcon fontSize="small" />
  },
  {
    title: "Government Schemes",
    description: "Discover and track schemes and benefits relevant to your region.",
    icon: <AccountBalanceIcon fontSize="small" />
  }
];

const LandingPage: React.FC = () => {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";

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
          maxWidth="lg"
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
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
            aria-label="Toggle theme"
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

        <Container maxWidth="md" sx={{ textAlign: "center", zIndex: 1 }}>
          <Stack spacing={2.5} alignItems="center">
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4rem" },
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: "uppercase"
              }}
            >
              KrishiMitra-AI
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 500 }}>
              AI Powered Agriculture Intelligence
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ pt: 1 }}>
              <Button
                variant="contained"
                color="success"
                component={RouterLink}
                to="/login"
                sx={{ minWidth: 160 }}
              >
                Sign In
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
                Sign Up
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Box id="features" sx={{ py: { xs: 6, md: 8 }, bgcolor: isDark ? "#0f2d1e" : "#f6fbf7" }}>
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Stack spacing={1} alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Platform Features
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", maxWidth: 640 }}>
                A unified agriculture platform delivering intelligent advisory, market intelligence, and
                sustainability insights.
              </Typography>
            </Stack>
            <Suspense
              fallback={
                <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                  <Typography variant="body2">Loading features...</Typography>
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
        <Container maxWidth="md">
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
