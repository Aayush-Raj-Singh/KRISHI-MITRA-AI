import React, { useMemo } from "react";
import { Card, CardContent, Grid, Stack, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { useAppSelector } from "../store/hooks";

const PortalPage: React.FC = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const role = user?.role || "farmer";

  const modules = useMemo(() => {
    if (role === "admin") {
      return [
        { title: t("nav.admin_master_data"), path: "/admin/master-data" },
        {
          title: t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
          path: "/services/market-intelligence?tab=trends"
        },
        {
          title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
          path: "/disease-detection"
        },
        { title: t("nav.audit_logs"), path: "/admin/audit-logs" },
        { title: t("nav.data_quality"), path: "/admin/quality" }
      ];
    }
    if (role === "extension_officer") {
      return [
        { title: t("nav.officer_workflow"), path: "/officer/workflow" },
        { title: t("nav.market_directory"), path: "/mandi-directory" },
        {
          title: t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
          path: "/services/market-intelligence?tab=arrivals"
        },
        {
          title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
          path: "/disease-detection"
        },
        {
          title: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
          path: "/services/farm-operations?tab=crop"
        }
      ];
    }
    return [
      {
        title: t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
        path: "/services/market-intelligence?tab=price"
      },
      {
        title: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
        path: "/services/farm-operations?tab=crop"
      },
      {
        title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
        path: "/disease-detection"
      },
      { title: t("nav.market_directory"), path: "/mandi-directory" },
      { title: t("nav.helpdesk"), path: "/helpdesk" }
    ];
  }, [role, t]);

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Typography variant="h4">{t("nav.portal")}</Typography>
        <Grid container spacing={2}>
          {modules.map((module) => (
            <Grid item xs={12} md={6} key={module.path}>
              <Card sx={{ border: "1px solid #e7ddcc" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {module.title}
                  </Typography>
                  <Button variant="contained" onClick={() => navigate(module.path)}>
                    {t("actions.open", { defaultValue: "Open" })}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default PortalPage;
