import React, { useMemo } from "react";
import { Box, Button, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import FeedbackIcon from "@mui/icons-material/Feedback";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
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
        title: t("dashboard.crop"),
        description: t("dashboard_page.services.crop_description"),
        icon: <AgricultureIcon color="primary" />,
        path: "/services/crop"
      },
      {
        title: t("dashboard.price"),
        description: t("dashboard_page.services.price_description"),
        icon: <ShowChartIcon color="primary" />,
        path: "/services/price"
      },
      {
        title: t("dashboard.water"),
        description: t("dashboard_page.services.water_description"),
        icon: <WaterDropIcon color="primary" />,
        path: "/services/water"
      },
      {
        title: t("dashboard.feedback"),
        description: t("dashboard_page.services.feedback_description"),
        icon: <FeedbackIcon color="primary" />,
        path: "/services/feedback"
      },
      {
        title: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }),
        description: t("services_page.modern_farming_description", {
          defaultValue: "Practical modern farming plans for 250 crop and vegetable guides."
        }),
        icon: <AutoAwesomeIcon color="primary" />,
        path: "/services/modern-farming"
      }
    ],
    [t]
  );

  return (
    <AppLayout>
      <Stack spacing={2}>
        <AgricultureHero
          icon={<AgricultureIcon color="primary" />}
          title={t("dashboard_page.services.title")}
          subtitle={t("dashboard_page.services.subtitle")}
          badges={[t("dashboard.crop"), t("dashboard.price"), t("dashboard.water"), t("advisory.title")]}
          imageSrc="/assets/agri-slider/slide-10.jpg"
        />

        <Grid container spacing={2}>
          {services.map((service) => (
            <Grid item xs={12} sm={6} md={3} key={service.title}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Box>{service.icon}</Box>
                    <Typography variant="subtitle1">{service.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service.description}
                    </Typography>
                    <Button variant="contained" onClick={() => navigate(service.path)}>
                      {t("dashboard_page.services.open")}
                    </Button>
                  </Stack>
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
