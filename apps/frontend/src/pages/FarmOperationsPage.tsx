import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { CropRecommendationContent } from "./CropRecommendationPage";
import { WaterOptimizationContent } from "./WaterOptimizationPage";

const FarmOperationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = (searchParams.get("tab") || "").toLowerCase();

  const tabs = useMemo(
    () => [
      {
        id: "crop",
        label: t("dashboard.crop"),
        content: <CropRecommendationContent embedded />
      },
      {
        id: "water",
        label: t("dashboard.water"),
        content: <WaterOptimizationContent embedded />
      }
    ],
    [t]
  );

  const defaultTab = tabs[0]?.id || "crop";
  const [activeTab, setActiveTab] = useState(() => (tabs.some((tab) => tab.id === tabFromQuery) ? tabFromQuery : defaultTab));

  useEffect(() => {
    if (!tabFromQuery) return;
    if (tabs.some((tab) => tab.id === tabFromQuery) && tabFromQuery !== activeTab) {
      setActiveTab(tabFromQuery);
    }
  }, [tabFromQuery, tabs, activeTab]);

  const handleTabChange = (_event: React.SyntheticEvent, value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content || tabs[0]?.content;

  return (
    <AppLayout>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {t("services_page.farm_operations_title", { defaultValue: "Farm Operations" })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("services_page.farm_operations_description", {
              defaultValue: "Crop planning and irrigation optimization with shared farm inputs."
            })}
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Farm operations tabs">
          {tabs.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>

        <Box>{activeContent}</Box>
      </Stack>
    </AppLayout>
  );
};

export default FarmOperationsPage;
