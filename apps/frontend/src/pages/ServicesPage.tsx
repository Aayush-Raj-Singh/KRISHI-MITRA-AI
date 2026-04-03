import React, { useMemo } from "react";
import {
  alpha,
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
import AgricultureIcon from "@mui/icons-material/Agriculture";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BugReportIcon from "@mui/icons-material/BugReport";
import FeedbackIcon from "@mui/icons-material/Feedback";
import InsightsIcon from "@mui/icons-material/Insights";
import PublicIcon from "@mui/icons-material/Public";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { navigateWithViewTransition } from "../utils/viewTransitions";

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const services = useMemo(
    () => [
      {
        title: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
        description: t("services_page.farm_operations_description", {
          defaultValue: "Crop planning and irrigation optimization with shared farm inputs.",
        }),
        icon: <AgricultureIcon color="primary" />,
        path: "/services/farm-operations",
        accent: "#1f6d45",
        metric: "Season planning",
        tags: ["Crop", "Irrigation", "Schedules"],
      },
      {
        title: t("services_page.national_agriculture_intelligence", {
          defaultValue: "National Agriculture Intelligence",
        }),
        description: t("services_page.national_agriculture_intelligence_description", {
          defaultValue:
            "Dynamic state-specific mandi, weather, schemes, and AI context across all states and UTs.",
        }),
        icon: <PublicIcon color="primary" />,
        path: "/services/national-intelligence",
        accent: "#325b87",
        metric: "36 region engine",
        tags: ["States", "Schemes", "Weather"],
      },
      {
        title: t("services_page.market_intelligence_title", {
          defaultValue: "Market Intelligence",
        }),
        description: t("services_page.market_intelligence_description", {
          defaultValue: "Forecasts, arrivals, trends, and alert signals in one workspace.",
        }),
        icon: <InsightsIcon color="primary" />,
        path: "/services/market-intelligence",
        accent: "#8f4c1a",
        metric: "Live mandi radar",
        tags: ["Prices", "Arrivals", "Signals"],
      },
      {
        title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
        description: t("services_page.disease_detection_description", {
          defaultValue: "Upload crop images to detect diseases and get treatment guidance.",
        }),
        icon: <BugReportIcon color="primary" />,
        path: "/disease-detection",
        accent: "#8b2f2f",
        metric: "Plant health AI",
        tags: ["Diagnosis", "Treatment", "Prevention"],
      },
      {
        title: t("dashboard.feedback"),
        description: t("dashboard_page.services.feedback_description"),
        icon: <FeedbackIcon color="primary" />,
        path: "/services/feedback",
        accent: "#2f7c88",
        metric: "Outcome tracking",
        tags: ["Impact", "Feedback", "Learning"],
      },
      {
        title: t("nav.market_directory"),
        description: t("services_page.market_directory_description", {
          defaultValue: "Browse mandi profiles, facilities, and contact details.",
        }),
        icon: <StorefrontIcon color="primary" />,
        path: "/mandi-directory",
        accent: "#7b5a2d",
        metric: "Mandi access map",
        tags: ["Directory", "Facilities", "Distance"],
      },
      {
        title: t("nav.helpdesk"),
        description: t("services_page.helpdesk_description", {
          defaultValue: "Raise support tickets and track responses.",
        }),
        icon: <SupportAgentIcon color="primary" />,
        path: "/helpdesk",
        accent: "#455a64",
        metric: "Support lane",
        tags: ["Tickets", "Status", "Resolution"],
      },
      {
        title: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }),
        description: t("services_page.modern_farming_description", {
          defaultValue: "Practical modern farming plans for 250 crop and vegetable guides.",
        }),
        icon: <AutoAwesomeIcon color="primary" />,
        path: "/services/modern-farming",
        accent: "#8e6d28",
        metric: "Practice library",
        tags: ["Guides", "Methods", "Productivity"],
      },
    ],
    [t],
  );

  const serviceBands = useMemo(
    () => [
      {
        title: "Plan",
        caption: "Move from season setup to crop and water decisions.",
        items: [services[0], services[7]],
      },
      {
        title: "Sense",
        caption: "Read market and crop-health signals before acting.",
        items: [services[1], services[2], services[3]],
      },
      {
        title: "Respond",
        caption: "Close the loop with field outcomes, mandis, and support.",
        items: [services[4], services[5], services[6]],
      },
    ],
    [services],
  );

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<AgricultureIcon color="primary" />}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("dashboard_page.services.title")}
          subtitle="A field-to-market operating map for planning, monitoring, diagnosis, and support in one agriculture-native service layer."
          badges={[
            "Season-aware workspaces",
            "Market and disease intelligence",
            "Farmer support operations",
            "Portal-grade workflows",
          ]}
          imageSrc="/assets/agri-slider/slide-10.jpg"
          transitionNames={{
            shell: "page-hero-shell",
            title: "page-hero-title",
            subtitle: "page-hero-subtitle",
            media: "page-hero-media",
          }}
        />

        <Grid container spacing={2.2}>
          {[
            { label: "Service nodes", value: services.length, tone: "#1f6d45" },
            { label: "Primary workflow", value: "Plan -> Sense -> Respond", tone: "#8f4c1a" },
            { label: "Decision style", value: "Agriculture-led interface", tone: "#2f7c88" },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${alpha(item.tone, 0.16)}`,
                  bgcolor: isDark ? alpha("#0f2015", 0.72) : alpha("#ffffff", 0.88),
                }}
              >
                <Typography variant="caption" sx={{ color: item.tone, fontWeight: 800 }}>
                  {item.label}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.7, fontWeight: 800 }}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8.5}>
            <Grid container spacing={2.2}>
              {services.map((service) => (
                <Grid item xs={12} sm={6} xl={4} key={service.title}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: `1px solid ${alpha(service.accent, 0.18)}`,
                      background: isDark
                        ? `linear-gradient(145deg, ${alpha(service.accent, 0.16)} 0%, rgba(12,30,21,0.98) 100%)`
                        : `linear-gradient(145deg, ${alpha(service.accent, 0.08)} 0%, rgba(255,255,255,0.98) 100%)`,
                      boxShadow: isDark
                        ? "0 18px 30px rgba(0,0,0,0.24)"
                        : "0 18px 30px rgba(16, 66, 35, 0.12)",
                      position: "relative",
                      overflow: "hidden",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: isDark
                          ? "0 22px 36px rgba(0,0,0,0.3)"
                          : "0 22px 36px rgba(16, 66, 35, 0.18)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        background: `radial-gradient(circle at top right, ${alpha(service.accent, 0.18)} 0%, transparent 55%)`,
                        pointerEvents: "none",
                      }}
                    />
                    <CardContent sx={{ height: "100%", p: 2.6, position: "relative", zIndex: 1 }}>
                      <Stack spacing={1.5} sx={{ height: "100%" }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box
                            sx={{
                              width: 52,
                              height: 52,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: 2.2,
                              bgcolor: alpha(service.accent, 0.12),
                              color: service.accent,
                              boxShadow: `inset 0 0 0 1px ${alpha(service.accent, 0.16)}`,
                            }}
                          >
                            {service.icon}
                          </Box>
                          <Chip
                            size="small"
                            label={service.metric}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 700,
                              bgcolor: alpha(service.accent, 0.1),
                              color: service.accent,
                            }}
                          />
                        </Stack>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                            }}
                          >
                            {service.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.9, lineHeight: 1.72 }}
                          >
                            {service.description}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {service.tags.map((tag) => (
                            <Chip
                              key={tag}
                              size="small"
                              variant="outlined"
                              label={tag}
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                          ))}
                        </Stack>
                        <Box sx={{ mt: "auto" }}>
                          <Button
                            fullWidth
                            variant="contained"
                            endIcon={<ArrowOutwardIcon />}
                            onClick={() => navigateWithViewTransition(navigate, service.path)}
                            sx={{
                              py: 1.1,
                              borderRadius: 2.2,
                              fontWeight: 700,
                              textTransform: "none",
                              background: `linear-gradient(90deg, ${service.accent} 0%, ${alpha(service.accent, 0.82)} 100%)`,
                            }}
                          >
                            {t("dashboard_page.services.open")}
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} lg={3.5}>
            <Stack spacing={2.2}>
              {serviceBands.map((band) => (
                <Paper
                  key={band.title}
                  elevation={0}
                  sx={{
                    p: 2.2,
                    borderRadius: 3,
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(31,84,50,0.12)",
                    bgcolor: isDark ? alpha("#102116", 0.82) : alpha("#ffffff", 0.9),
                  }}
                >
                  <Stack spacing={1.2}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                      }}
                    >
                      {band.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {band.caption}
                    </Typography>
                    <Stack spacing={1}>
                      {band.items.map((item) => (
                        <Button
                          key={item.path}
                          variant="outlined"
                          onClick={() => navigateWithViewTransition(navigate, item.path)}
                          endIcon={<ArrowOutwardIcon />}
                          sx={{
                            justifyContent: "space-between",
                            textTransform: "none",
                            borderRadius: 2,
                            fontWeight: 700,
                          }}
                        >
                          {item.title}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}

              <Paper
                elevation={0}
                sx={{
                  overflow: "hidden",
                  borderRadius: 3,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(31,84,50,0.12)",
                }}
              >
                <Box
                  component="img"
                  src="/assets/agri-slider/slide-07.jpg"
                  alt="Agriculture services"
                  sx={{ width: "100%", height: 190, objectFit: "cover", display: "block" }}
                />
                <Box
                  sx={{ p: 2.2, bgcolor: isDark ? alpha("#102116", 0.86) : alpha("#ffffff", 0.94) }}
                >
                  <Stack spacing={0.8}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WaterDropIcon sx={{ color: "#2f7c88" }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                        Service journey
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.72 }}>
                      Start with planning, validate against live market and disease signals, then
                      close the loop through support and feedback.
                    </Typography>
                  </Stack>
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default ServicesPage;
