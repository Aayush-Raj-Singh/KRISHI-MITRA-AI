import React from "react";
import { Grid } from "@mui/material";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useTranslation } from "react-i18next";

import LoginForm from "../components/auth/LoginForm";
import AuthShell from "../components/common/AuthShell";
import AuthShowcase from "../components/common/AuthShowcase";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <AuthShell>
      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        <Grid item xs={12} md={7}>
          <AuthShowcase
            title={t("layout.dbt_portal")}
            subtitle={t("login_page.portal_description")}
            points={[
              {
                icon: <CheckCircleIcon color="success" fontSize="small" />,
                text: t("login_page.feature_crop_price_water"),
              },
              {
                icon: <CheckCircleIcon color="success" fontSize="small" />,
                text: t("login_page.feature_ai_runtime", {
                  defaultValue: "Personalized advisory powered by a switchable AI runtime.",
                }),
              },
              {
                icon: <CheckCircleIcon color="success" fontSize="small" />,
                text: t("login_page.feature_multilingual"),
              },
              {
                icon: <TipsAndUpdatesIcon color="primary" fontSize="small" />,
                text: t("login_page.latest_update"),
              },
            ]}
          />
        </Grid>
        <Grid item xs={12} md={5} sx={{ display: "flex", alignItems: "center" }}>
          <LoginForm />
        </Grid>
      </Grid>
    </AuthShell>
  );
};

export default LoginPage;
