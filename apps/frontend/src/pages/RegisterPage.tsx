import React from "react";
import { Grid } from "@mui/material";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import NatureIcon from "@mui/icons-material/Nature";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import { useTranslation } from "react-i18next";

import RegisterForm from "../components/auth/RegisterForm";
import AuthShell from "../components/common/AuthShell";
import AuthShowcase from "../components/common/AuthShowcase";

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        <Grid item xs={12} md={5}>
          <AuthShowcase
            title={t("register_page.title")}
            subtitle={t("register_page.subtitle")}
            points={[
              {
                icon: <WaterDropIcon color="primary" fontSize="small" />,
                text: t("register_page.feature_irrigation"),
              },
              {
                icon: <ShowChartIcon color="secondary" fontSize="small" />,
                text: t("register_page.feature_price"),
              },
              {
                icon: <NatureIcon color="success" fontSize="small" />,
                text: t("register_page.feature_sustainability"),
              },
              {
                icon: <AgricultureIcon color="primary" fontSize="small" />,
                text: t("layout.dbt_portal"),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={7} sx={{ display: "flex", alignItems: "center" }}>
          <RegisterForm />
        </Grid>
      </Grid>
    </AuthShell>
  );
};

export default RegisterPage;
