import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DashboardHeroSummary } from "@krishimitra/shared";

import { ActionTile } from "../components/ActionTile";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { StatBox } from "../components/StatBox";
import { importantLinks, notices, serviceCatalog } from "../data/appContent";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { openAppRoute } from "../navigation/routeHelpers";
import { dashboardApi, withRetry } from "../services/api";
import { syncOfflineQueue } from "../services/offlineSync";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";

const heroCacheKey = buildCacheKey("dashboard:hero");

export const DashboardScreen = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [summary, setSummary] = useState<DashboardHeroSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const copy = useMobileTranslatedContent({
    latestActivity: "Latest activity",
    savedInHistory: "Saved in history",
    noRecommendations: "No recommendations have been created yet.",
    role: "Role",
    location: "Location",
    notSet: "Not set",
    primaryCrops: "Primary crops",
  });
  const translatedStatus = useMobileTranslatedContent({ status: status || "" }).status;
  const translatedNotices = useMobileTranslatedContent(notices);
  const translatedImportantLinks = useMobileTranslatedContent(importantLinks, {
    ignoreKeys: ["route", "icon"],
  });

  const loadSummary = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const response = await withRetry(() => dashboardApi.getHeroSummary());
      setSummary(response);
      await writeCacheRecord(heroCacheKey, response);
      setStatus("Live dashboard summary refreshed.");
    } catch (error) {
      const cached = await readCacheRecord<DashboardHeroSummary>(heroCacheKey);
      if (cached) {
        setSummary(cached.value);
        setStatus(
          `Showing cached dashboard data from ${new Date(cached.updatedAt).toLocaleString()}.`,
        );
      } else {
        setStatus(
          error instanceof Error ? error.message : "Dashboard data is unavailable right now.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const handleSync = async () => {
    try {
      const processed = await syncOfflineQueue();
      setStatus(
        processed > 0
          ? `Synced ${processed} queued updates to the backend.`
          : "No queued changes were waiting to sync.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to sync queued updates right now.",
      );
    }
  };

  return (
    <ScreenShell
      title={`Namaste${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
      subtitle="The same product overview as web: field metrics, quick launch cards, notices, and profile actions in one mobile control center."
      eyebrow="Dashboard"
      heroImageSource={require("../../assets/hero-slide-06.jpg")}
      heroBadges={["Crop Planning", "Market Intelligence", "Water Optimization", "AI Advisory"]}
    >
      {status ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{translatedStatus}</Text>
        </View>
      ) : null}

      <SectionCard
        title="Hero overview"
        subtitle="Key metrics from the same dashboard hero summary used by the web workspace."
      >
        <View style={styles.metricsGrid}>
          <StatBox label="Recommendations" value={`${summary?.total_recommendations ?? 0}`} />
          <StatBox
            label="Water savings"
            value={
              summary?.latest_water_savings_percent
                ? `${summary.latest_water_savings_percent.toFixed(1)}%`
                : "--"
            }
          />
          <StatBox
            label="Sustainability"
            value={
              summary?.latest_sustainability_score
                ? summary.latest_sustainability_score.toFixed(1)
                : "--"
            }
          />
        </View>

        <View style={styles.contextBlock}>
          <Text style={styles.contextTitle}>{copy.latestActivity}</Text>
          <Text style={styles.contextText}>
            {summary?.latest_recommendation_kind
              ? `${summary.latest_recommendation_kind} | ${
                  summary.latest_recommendation_context || copy.savedInHistory
                }`
              : copy.noRecommendations}
          </Text>
        </View>
      </SectionCard>

      <SectionCard
        title="Quick launch"
        subtitle="Jump into the same major workspaces highlighted across the web dashboard and services page."
      >
        <View style={styles.tileGrid}>
          {serviceCatalog.slice(0, 6).map((service) => (
            <ActionTile
              key={service.route}
              description={service.description}
              icon={service.icon}
              meta={service.meta}
              onPress={() => openAppRoute(navigation, service.route)}
              title={service.title}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Noticeboard"
        subtitle="Current updates and shortcuts mirrored from the web dashboard."
      >
        <View style={styles.noticeList}>
          {translatedNotices.slice(0, 3).map((notice) => (
            <View key={notice.title} style={styles.noticeRow}>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeMeta}>{notice.date}</Text>
            </View>
          ))}
          {translatedImportantLinks.slice(0, 2).map((link) => (
            <Pressable
              key={link.label}
              onPress={() => openAppRoute(navigation, link.route)}
              style={styles.linkCard}
            >
              <Text style={styles.linkText}>{link.label}</Text>
              <Text style={styles.linkMeta}>{link.description}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Farmer profile"
        subtitle="Persisted locally for faster launch and offline continuity."
      >
        <Text style={styles.profileText}>
          {copy.role}: {user?.role || "farmer"}
        </Text>
        <Text style={styles.profileText}>
          {copy.location}: {user?.location || copy.notSet}
        </Text>
        <Text style={styles.profileText}>
          {copy.primaryCrops}: {user?.primary_crops?.length ? user.primary_crops.join(", ") : copy.notSet}
        </Text>
      </SectionCard>

      <SectionCard
        title="Actions"
        subtitle="Refresh cached data, push queued feedback, or sign out securely."
      >
        <PrimaryButton
          label="Refresh dashboard"
          loading={loading}
          onPress={() => void loadSummary()}
        />
        <PrimaryButton
          label="Sync queued updates"
          onPress={() => void handleSync()}
          tone="secondary"
        />
        <PrimaryButton label="Sign out" onPress={logout} tone="secondary" />
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#ecf4ee",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c8ddcc",
    padding: 14,
  },
  bannerText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  contextBlock: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  contextTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  contextText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 19,
  },
  profileText: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
  },
  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  noticeList: {
    gap: spacing.sm,
  },
  noticeRow: {
    gap: 2,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  noticeMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
  linkCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: 12,
    gap: 4,
  },
  linkMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
