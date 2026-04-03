import React, { useEffect, useMemo, useState } from "react";
import { useRoute } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import type {
  MarketAlert,
  MandiDirectoryItem,
  PriceArrivalDashboardResponse,
  PriceForecastResponse,
  TrendAnalyticsResponse,
} from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { InlineTabs } from "../components/InlineTabs";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { StatBox } from "../components/StatBox";
import { dashboardApi, marketApi, recommendationApi, withRetry } from "../services/api";
import { buildMandiOptions } from "../utils/mandiOptions";
import { colors, spacing, typography } from "../theme";

type TabId = "price" | "arrivals" | "trends" | "alerts";

export const MarketIntelligenceScreen = () => {
  const route = useRoute<any>();
  const initialTab =
    route.name === "PriceArrivalDashboard"
      ? "arrivals"
      : route.name === "TrendAnalytics"
        ? "trends"
        : route.name === "MarketAlerts"
          ? "alerts"
          : route.name === "PriceForecast"
            ? "price"
            : route.params?.initialTab;
  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab === "arrivals" || initialTab === "trends" || initialTab === "alerts"
      ? initialTab
      : "price",
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState<TabId | null>(null);
  const [directory, setDirectory] = useState<MandiDirectoryItem[]>([]);

  const [priceForm, setPriceForm] = useState({
    crop: "rice",
    market: "Patna",
    currency: "INR",
  });
  const [filters, setFilters] = useState({
    state: "",
    district: "",
    mandi: "",
    commodity: "",
    date_from: "",
    date_to: "",
  });

  const [priceResult, setPriceResult] = useState<PriceForecastResponse | null>(null);
  const [arrivalsResult, setArrivalsResult] = useState<PriceArrivalDashboardResponse | null>(null);
  const [trendsResult, setTrendsResult] = useState<TrendAnalyticsResponse | null>(null);
  const [alertsResult, setAlertsResult] = useState<MarketAlert[]>([]);

  useEffect(() => {
    if (
      initialTab === "price" ||
      initialTab === "arrivals" ||
      initialTab === "trends" ||
      initialTab === "alerts"
    ) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const screenMeta =
    route.name === "PriceForecast"
      ? {
          title: "Price forecast",
          subtitle:
            "Query the same crop price forecasting workflow used by the web price forecast page.",
          eyebrow: "Market Forecast",
          heroBadges: ["Forecast Horizon", "Crop Prices", "Market Signals"],
        }
      : route.name === "PriceArrivalDashboard"
        ? {
            title: "Price + arrivals",
            subtitle:
              "Monitor the same arrivals dashboard and mandi summary metrics shown on the web arrivals page.",
            eyebrow: "Market Dashboard",
            heroBadges: ["Arrivals", "Modal Price", "Mandi Summary"],
          }
        : route.name === "TrendAnalytics"
          ? {
              title: "Trend analytics",
              subtitle:
                "Inspect the same trend windows, volatility, and alert notes available on the web trend analytics page.",
              eyebrow: "Trend Monitor",
              heroBadges: ["Volatility", "Trend Windows", "Signal Notes"],
            }
          : route.name === "MarketAlerts"
            ? {
                title: "Market alerts",
                subtitle:
                  "Review the same alert feed and price-movement watchlist exposed by the web market alerts page.",
                eyebrow: "Alert Feed",
                heroBadges: ["Price Shifts", "Alert Notes", "Market Watch"],
              }
            : {
                title: "Market intelligence",
                subtitle:
                  "Forecasts, arrivals, trends, and market alerts now live in the same four-part workspace used on web.",
                eyebrow: "Market Workspace",
                heroBadges: ["Price Forecast", "Arrivals", "Trend Analytics", "Market Alerts"],
              };

  useEffect(() => {
    withRetry(() => marketApi.getMandiDirectory({ limit: 200 }))
      .then(setDirectory)
      .catch(() => undefined);
  }, []);

  const options = useMemo(() => buildMandiOptions(directory), [directory]);
  const districtOptions = useMemo(
    () => options.getDistrictsForState(filters.state),
    [filters.state, options],
  );
  const mandiOptions = useMemo(
    () => options.getMandisForDistrict(filters.state, filters.district),
    [filters.district, filters.state, options],
  );

  const helperFor = (items: string[]) =>
    items.length > 0 ? `Examples: ${items.slice(0, 3).join(", ")}` : undefined;

  const filterPayload = {
    state: filters.state || undefined,
    district: filters.district || undefined,
    mandi: filters.mandi || undefined,
    commodity: filters.commodity || undefined,
    date_from: filters.date_from || undefined,
    date_to: filters.date_to || undefined,
  };

  const loadPrice = async () => {
    setLoading("price");
    setNotice(null);
    try {
      const response = await recommendationApi.getPriceForecast({
        crop: priceForm.crop,
        market: priceForm.market,
        currency: priceForm.currency,
      });
      setPriceResult(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load the price forecast.");
    } finally {
      setLoading(null);
    }
  };

  const loadArrivals = async () => {
    setLoading("arrivals");
    setNotice(null);
    try {
      const response = await dashboardApi.getPriceArrivalDashboard(filterPayload);
      setArrivalsResult(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load arrival intelligence.");
    } finally {
      setLoading(null);
    }
  };

  const loadTrends = async () => {
    setLoading("trends");
    setNotice(null);
    try {
      const response = await marketApi.getTrendAnalytics(filterPayload);
      setTrendsResult(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load trend analytics.");
    } finally {
      setLoading(null);
    }
  };

  const loadAlerts = async () => {
    setLoading("alerts");
    setNotice(null);
    try {
      const response = await marketApi.getMarketAlerts(filterPayload);
      setAlertsResult(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load market alerts.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScreenShell
      title={screenMeta.title}
      subtitle={screenMeta.subtitle}
      eyebrow={screenMeta.eyebrow}
      heroImageSource={require("../../assets/hero-slide-07.jpg")}
      heroBadges={screenMeta.heroBadges}
    >
      {route.name !== "PriceForecast" &&
      route.name !== "PriceArrivalDashboard" &&
      route.name !== "TrendAnalytics" &&
      route.name !== "MarketAlerts" ? (
        <InlineTabs
          activeKey={activeTab}
          items={[
            { key: "price", label: "Price" },
            { key: "arrivals", label: "Arrivals" },
            { key: "trends", label: "Trends" },
            { key: "alerts", label: "Alerts" },
          ]}
          onChange={(value) => setActiveTab(value as TabId)}
        />
      ) : null}

      {notice ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{notice}</Text>
        </View>
      ) : null}

      {activeTab === "price" ? (
        <SectionCard
          title="Price forecast"
          subtitle="Same forecast API and response structure as web."
        >
          <FieldInput
            label="Crop"
            onChangeText={(value) => setPriceForm((prev) => ({ ...prev, crop: value }))}
            value={priceForm.crop}
          />
          <FieldInput
            label="Market"
            onChangeText={(value) => setPriceForm((prev) => ({ ...prev, market: value }))}
            value={priceForm.market}
          />
          <FieldInput
            autoCapitalize="characters"
            label="Currency"
            onChangeText={(value) => setPriceForm((prev) => ({ ...prev, currency: value }))}
            value={priceForm.currency}
          />
          <PrimaryButton
            label="Forecast prices"
            loading={loading === "price"}
            onPress={() => void loadPrice()}
          />
          {priceResult && priceResult.series[0] ? (
            <View style={styles.resultBlock}>
              <Text style={styles.resultTitle}>
                {priceResult.crop} | {priceResult.market}
              </Text>
              <Text style={styles.resultText}>MAPE {priceResult.mape.toFixed(2)}%</Text>
              {priceResult.series[0].dates.slice(0, 5).map((date, index) => (
                <View key={date} style={styles.resultRow}>
                  <Text style={styles.resultTitle}>{date}</Text>
                  <Text style={styles.resultText}>
                    {priceResult.series[0].forecast[index].toFixed(2)} {priceResult.currency}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </SectionCard>
      ) : null}

      {activeTab !== "price" ? (
        <SectionCard
          title="Shared filters"
          subtitle="State, district, mandi, and commodity filters mirror the web market workspace."
        >
          <FieldInput
            helperText={helperFor(options.states)}
            label="State"
            onChangeText={(value) =>
              setFilters((prev) => ({ ...prev, state: value, district: "", mandi: "" }))
            }
            value={filters.state}
          />
          <FieldInput
            helperText={helperFor(districtOptions)}
            label="District"
            onChangeText={(value) =>
              setFilters((prev) => ({ ...prev, district: value, mandi: "" }))
            }
            value={filters.district}
          />
          <FieldInput
            helperText={helperFor(mandiOptions)}
            label="Mandi"
            onChangeText={(value) => setFilters((prev) => ({ ...prev, mandi: value }))}
            value={filters.mandi}
          />
          <FieldInput
            helperText={helperFor(options.commodities)}
            label="Commodity"
            onChangeText={(value) => setFilters((prev) => ({ ...prev, commodity: value }))}
            value={filters.commodity}
          />
          <FieldInput
            helperText="YYYY-MM-DD"
            label="From date"
            onChangeText={(value) => setFilters((prev) => ({ ...prev, date_from: value }))}
            value={filters.date_from}
          />
          <FieldInput
            helperText="YYYY-MM-DD"
            label="To date"
            onChangeText={(value) => setFilters((prev) => ({ ...prev, date_to: value }))}
            value={filters.date_to}
          />
          {activeTab === "arrivals" ? (
            <PrimaryButton
              label="Load arrivals"
              loading={loading === "arrivals"}
              onPress={() => void loadArrivals()}
            />
          ) : null}
          {activeTab === "trends" ? (
            <PrimaryButton
              label="Load trends"
              loading={loading === "trends"}
              onPress={() => void loadTrends()}
            />
          ) : null}
          {activeTab === "alerts" ? (
            <PrimaryButton
              label="Load alerts"
              loading={loading === "alerts"}
              onPress={() => void loadAlerts()}
            />
          ) : null}
        </SectionCard>
      ) : null}

      {activeTab === "arrivals" && arrivalsResult ? (
        <SectionCard
          title="Price and arrivals"
          subtitle="Summary and latest time-series points from the dashboard API."
        >
          <View style={styles.statsGrid}>
            <StatBox label="Avg price" value={`${arrivalsResult.summary.average_price}`} />
            <StatBox label="Modal price" value={`${arrivalsResult.summary.modal_price}`} />
            <StatBox label="Spread" value={`${arrivalsResult.summary.price_spread}`} />
            <StatBox label="Arrivals" value={`${arrivalsResult.summary.total_arrivals_qtl}`} />
          </View>
          {arrivalsResult.series.slice(0, 6).map((item) => (
            <View key={item.date} style={styles.resultRow}>
              <Text style={styles.resultTitle}>{item.date}</Text>
              <Text style={styles.resultText}>
                Avg {item.avg_price} | Modal {item.modal_price} | Arrivals {item.arrivals_qtl}
              </Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {activeTab === "trends" && trendsResult ? (
        <SectionCard
          title="Trend analytics"
          subtitle="Historical windows, volatility, and alert notes from the same analytics endpoint as web."
        >
          <View style={styles.statsGrid}>
            <StatBox label="Volatility" value={`${trendsResult.volatility}`} />
            <StatBox label="Windows" value={`${trendsResult.windows.length}`} />
            <StatBox label="Alerts" value={`${trendsResult.alerts.length}`} />
          </View>
          {trendsResult.windows.map((window) => (
            <View key={window.window_days} style={styles.resultRow}>
              <Text style={styles.resultTitle}>{window.window_days}-day window</Text>
              <Text style={styles.resultText}>
                Change {window.change_pct}% | Avg {window.average_price} | Volatility{" "}
                {window.volatility}
              </Text>
            </View>
          ))}
          {trendsResult.alerts.slice(0, 4).map((alert) => (
            <Text key={`${alert.date}-${alert.note}`} style={styles.resultText}>
              - {alert.date}: {alert.note} ({alert.change_pct}%)
            </Text>
          ))}
        </SectionCard>
      ) : null}

      {activeTab === "alerts" && alertsResult.length > 0 ? (
        <SectionCard
          title="Market alerts"
          subtitle="The same alert feed as web, optimized into touch-first cards."
        >
          {alertsResult.map((alert) => (
            <View key={`${alert.date}-${alert.note}`} style={styles.resultRow}>
              <Text style={styles.resultTitle}>{alert.date}</Text>
              <Text style={styles.resultText}>{alert.note}</Text>
              <Text style={styles.resultText}>
                Change {alert.change_pct}% ({alert.change_abs})
              </Text>
            </View>
          ))}
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  resultBlock: {
    gap: spacing.sm,
  },
  resultRow: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  resultTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  resultText: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
