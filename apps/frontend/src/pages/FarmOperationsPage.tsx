import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
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
        content: <CropRecommendationContent embedded />,
      },
      {
        id: "water",
        label: t("dashboard.water"),
        content: <WaterOptimizationContent embedded />,
      },
    ],
    [t],
  );

  const defaultTab = tabs[0]?.id || "crop";
  const [activeTab, setActiveTab] = useState(() =>
    tabs.some((tab) => tab.id === tabFromQuery) ? tabFromQuery : defaultTab,
  );

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
      <Stack spacing={3}>
        <AgricultureHero
          icon={<span style={{ fontSize: 18 }}>⛁</span>}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("services_page.farm_operations_title", { defaultValue: "Farm Operations" })}
          subtitle={t("services_page.farm_operations_description", {
            defaultValue: "Crop planning and irrigation optimization with shared farm inputs.",
          })}
          badges={[
            "Crop planning",
            "Water scheduling",
            "Season-aware inputs",
            "Field execution desk",
          ]}
          imageSrc="/assets/agri-slider/slide-02.jpg"
        />

        <Paper
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: 3,
            border: "1px solid rgba(31,84,50,0.12)",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
          }}
        >
          <Stack spacing={1.6}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Farm operations workspace
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Switch between crop planning and water optimization within one field-ready
                  operating view.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {tabs.map((tab) => (
                  <Chip
                    key={tab.id}
                    label={tab.label}
                    color={tab.id === activeTab ? "primary" : "default"}
                    variant={tab.id === activeTab ? "filled" : "outlined"}
                    sx={{ borderRadius: 999, fontWeight: 700 }}
                  />
                ))}
              </Stack>
            </Stack>

            <Tabs value={activeTab} onChange={handleTabChange} aria-label="Farm operations tabs">
              {tabs.map((tab) => (
                <Tab key={tab.id} value={tab.id} label={tab.label} />
              ))}
            </Tabs>
          </Stack>
        </Paper>

        <Box>{activeContent}</Box>
      </Stack>
    </AppLayout>
  );
};

export default FarmOperationsPage;
