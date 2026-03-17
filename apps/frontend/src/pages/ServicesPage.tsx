import React, { useMemo } from "react";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import InsightsIcon from "@mui/icons-material/Insights";
import FeedbackIcon from "@mui/icons-material/Feedback";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import BugReportIcon from "@mui/icons-material/BugReport";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";

const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const services = useMemo(
    () => [
      {
        title: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
        description: t("services_page.farm_operations_description", {
          defaultValue: "Crop planning and irrigation optimization with shared farm inputs."
        }),
        icon: <AgricultureIcon color="primary" />,
        path: "/services/farm-operations"
      },
      {
        title: t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
        description: t("services_page.market_intelligence_description", {
          defaultValue: "Forecasts, arrivals, trends, and alert signals in one workspace."
        }),
        icon: <InsightsIcon color="primary" />,
        path: "/services/market-intelligence"
      },
      {
        title: t("dashboard.feedback"),
        description: t("dashboard_page.services.feedback_description"),
        icon: <FeedbackIcon color="primary" />,
        path: "/services/feedback"
      },
      {
        title: t("nav.market_directory"),
        description: t("services_page.market_directory_description", {
          defaultValue: "Browse mandi profiles, facilities, and contact details."
        }),
        icon: <StorefrontIcon color="primary" />,
        path: "/mandi-directory"
      },
      {
        title: t("nav.helpdesk"),
        description: t("services_page.helpdesk_description", {
          defaultValue: "Raise support tickets and track responses."
        }),
        icon: <SupportAgentIcon color="primary" />,
        path: "/helpdesk"
      },
      {
        title: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }),
        description: t("services_page.modern_farming_description", {
          defaultValue: "Practical modern farming plans for 250 crop and vegetable guides."
        }),
        icon: <AutoAwesomeIcon color="primary" />,
        path: "/services/modern-farming"
      },
      {
        title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
        description: t("services_page.disease_detection_description", {
          defaultValue: "Upload crop images to detect diseases and get treatment guidance."
        }),
        icon: <BugReportIcon color="primary" />,
        path: "/disease-detection"
      }
    ],
    [t]
  );

  return (
    <AppLayout>
      <Stack spacing={2}>
        <AgricultureHero
          icon={<AgricultureIcon color="primary" />}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("dashboard_page.services.title")}
          subtitle={t("dashboard_page.services.subtitle")}
          badges={[
            t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
            t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
            t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
            t("dashboard.feedback"),
            t("nav.market_directory"),
            t("nav.helpdesk")
          ]}
          imageSrc="/assets/agri-slider/slide-10.jpg"
        />

        <Grid container spacing={3}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={3} key={service.title}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 2.5,
                  border: "1px solid rgba(21, 86, 45, 0.16)",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244, 249, 244, 0.98) 100%)",
                  boxShadow: "0 18px 30px rgba(16, 66, 35, 0.12)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 22px 36px rgba(16, 66, 35, 0.2)",
                    borderColor: "rgba(21, 86, 45, 0.3)"
                  },
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background:
                      "radial-gradient(circle at 10% 0%, rgba(27, 107, 58, 0.08), transparent 55%)"
                  },
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 4,
                    width: "100%",
                    background: "linear-gradient(90deg, #1b6b3a 0%, #2f8b4f 60%, #78c07f 100%)"
                  }
                }}
              >
                <CardContent
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.6,
                    p: 3,
                    position: "relative",
                    zIndex: 1
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 2,
                      bgcolor: "rgba(27, 107, 58, 0.12)",
                      color: "#1b6b3a",
                      boxShadow: "inset 0 0 0 1px rgba(27, 107, 58, 0.2)",
                      "& svg": { fontSize: 24 }
                    }}
                  >
                    {service.icon}
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#1b1f1d",
                      fontFamily: '"Prata", serif',
                      letterSpacing: 0.2
                    }}
                  >
                    {service.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.7, fontFamily: '"Mukta", sans-serif' }}
                  >
                    {service.description}
                  </Typography>
                  <Box sx={{ mt: "auto" }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(service.path)}
                      sx={{
                        py: 1.15,
                        borderRadius: 2,
                        fontWeight: 700,
                        textTransform: "none",
                        letterSpacing: 0.2,
                        background: "linear-gradient(90deg, #1b6b3a 0%, #2f8b4f 100%)",
                        boxShadow: "0 10px 18px rgba(21, 88, 47, 0.28)",
                        "&:hover": {
                          background: "linear-gradient(90deg, #175f34 0%, #2a7f47 100%)",
                          boxShadow: "0 12px 20px rgba(21, 88, 47, 0.32)"
                        }
                      }}
                    >
                      {t("dashboard_page.services.open")}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default ServicesPage;
