import React from "react";
import { Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { useAppSelector } from "../store/hooks";
import { useTranslation } from "react-i18next";

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);

  const fullName = user?.name || t("auth.role_farmer");
  const roleCode = user?.role || "farmer";
  const roleLabel =
    roleCode === "farmer"
      ? t("auth.role_farmer")
      : roleCode === "extension_officer"
        ? t("auth.role_extension_officer")
        : roleCode === "admin"
          ? t("layout.role_admin")
          : roleCode.replace("_", " ");
  const location = user?.location || "-";
  const phone = user?.phone || "-";
  const soilType = user?.soil_type || "-";
  const farmSize = user?.farm_size ? `${user.farm_size}` : "-";
  const waterSource = user?.water_source || "-";
  const crops = user?.primary_crops?.join(", ") || "-";

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<AgricultureIcon color="primary" />}
          title={t("profile.title", { defaultValue: "Farmer Profile" })}
          subtitle={t("profile.subtitle", { defaultValue: "View your registered KrishiMitra details and farm profile." })}
          badges={[roleLabel, t("auth.location"), t("dashboard.crop")]}
          imageSrc="/assets/agri-slider/slide-03.png"
        />

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card sx={{ border: "1px solid #e7ddcc", height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.name")}
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {fullName}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.phone")}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {phone}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.location")}
                </Typography>
                <Typography variant="body1">{location}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ border: "1px solid #e7ddcc", height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.farm_size")}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {farmSize === "-" ? "-" : `${farmSize} acres`}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.soil_type")}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {soilType}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.water_source")}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {waterSource}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary">
                  {t("auth.primary_crops")}
                </Typography>
                <Typography variant="body1">{crops}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default ProfilePage;
