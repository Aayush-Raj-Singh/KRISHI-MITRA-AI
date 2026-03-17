import React, { useEffect, useMemo, useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { PriceForecastContent } from "./PriceForecastPage";
import { PriceArrivalDashboardContent } from "./PriceArrivalDashboardPage";
import { TrendAnalyticsContent } from "./TrendAnalyticsPage";
import { MarketAlertsContent } from "./MarketAlertsPage";

const MarketIntelligencePage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = (searchParams.get("tab") || "").toLowerCase();

  const tabs = useMemo(
    () => [
      {
        id: "price",
        label: t("dashboard.price"),
        content: <PriceForecastContent embedded />
      },
      {
        id: "arrivals",
        label: t("nav.price_arrival"),
        content: <PriceArrivalDashboardContent embedded />
      },
      {
        id: "trends",
        label: t("nav.trends"),
        content: <TrendAnalyticsContent embedded />
      },
      {
        id: "alerts",
        label: t("nav.market_alerts"),
        content: <MarketAlertsContent embedded />
      }
    ],
    [t]
  );

  const defaultTab = tabs[0]?.id || "price";
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
            {t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("services_page.market_intelligence_description", {
              defaultValue: "Forecasts, arrivals, trends, and alert signals in one workspace."
            })}
          </Typography>
        </Box>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label={t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" })}
        >
          {tabs.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>

        <Box>{activeContent}</Box>
      </Stack>
    </AppLayout>
  );
};

export default MarketIntelligencePage;
