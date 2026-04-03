import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Paper, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";
import { MandiPriceContent } from "./MandiPricePage";
import { PriceArrivalDashboardContent } from "./PriceArrivalDashboardPage";
import { TrendAnalyticsContent } from "./TrendAnalyticsPage";
import { MarketAlertsContent } from "./MarketAlertsPage";

const MarketIntelligencePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = (searchParams.get("tab") || "").toLowerCase();
  const copy = useTranslatedStrings(
    useMemo(
      () => ({
        heroSubtitle: "Forecasts, arrivals, trends, and alert signals in one workspace.",
        badgeForecastDesk: "Forecast desk",
        badgeArrivalIntelligence: "Arrival intelligence",
        badgeTrendAnalytics: "Trend analytics",
        badgeAlertMonitoring: "Alert monitoring",
        workspaceTitle: "Market workspace",
        workspaceSubtitle:
          "Move between forecasting, arrivals, historical behavior, and alert response without leaving the same workflow shell.",
      }),
      [],
    ),
  );

  const tabs = useMemo(
    () => [
      {
        id: "price",
        label: t("dashboard.price"),
        content: <MandiPriceContent embedded />,
      },
      {
        id: "arrivals",
        label: t("nav.price_arrival"),
        content: <PriceArrivalDashboardContent embedded />,
      },
      {
        id: "trends",
        label: t("nav.trends"),
        content: <TrendAnalyticsContent embedded />,
      },
      {
        id: "alerts",
        label: t("nav.market_alerts"),
        content: <MarketAlertsContent embedded />,
      },
    ],
    [t],
  );

  const defaultTab = tabs[0]?.id || "price";
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
          icon={<span style={{ fontSize: 18 }}>▥</span>}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("services_page.market_intelligence_title", {
            defaultValue: "Market Intelligence",
          })}
          subtitle={copy.heroSubtitle}
          badges={[
            copy.badgeForecastDesk,
            copy.badgeArrivalIntelligence,
            copy.badgeTrendAnalytics,
            copy.badgeAlertMonitoring,
          ]}
          imageSrc="/assets/agri-slider/slide-07.jpg"
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
                  {copy.workspaceTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.workspaceSubtitle}
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

            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label={t("services_page.market_intelligence_title", {
                defaultValue: "Market Intelligence",
              })}
            >
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

export default MarketIntelligencePage;
