import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DashboardHeroSummary } from "@krishimitra/shared";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { dashboardApi, withRetry } from "../services/api";
import { syncOfflineQueue } from "../services/offlineSync";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";

const heroCacheKey = buildCacheKey("dashboard:hero");

export const DashboardScreen = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [summary, setSummary] = useState<DashboardHeroSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
        setStatus(`Showing cached dashboard data from ${new Date(cached.updatedAt).toLocaleString()}.`);
      } else {
        setStatus(error instanceof Error ? error.message : "Dashboard data is unavailable right now.");
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
          : "No queued changes were waiting to sync."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to sync queued updates right now.");
    }
  };

  return (
    <ScreenShell
      title={`Namaste${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
      subtitle="A fast mobile control center for recommendations, market planning, advisory, disease checks, and feedback."
    >
      {status ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{status}</Text>
        </View>
      ) : null}

      <SectionCard title="Field snapshot" subtitle="The same backend metrics now optimized for quick mobile scanning.">
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{summary?.total_recommendations ?? 0}</Text>
            <Text style={styles.metricLabel}>Recommendations</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {summary?.latest_water_savings_percent ? `${summary.latest_water_savings_percent.toFixed(1)}%` : "--"}
            </Text>
            <Text style={styles.metricLabel}>Water savings</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>
              {summary?.latest_sustainability_score ? summary.latest_sustainability_score.toFixed(1) : "--"}
            </Text>
            <Text style={styles.metricLabel}>Sustainability</Text>
          </View>
        </View>

        <View style={styles.contextBlock}>
          <Text style={styles.contextTitle}>Latest activity</Text>
          <Text style={styles.contextText}>
            {summary?.latest_recommendation_kind
              ? `${summary.latest_recommendation_kind} • ${summary.latest_recommendation_context || "Saved in history"}`
              : "No recommendations have been created yet."}
          </Text>
        </View>
      </SectionCard>

      <SectionCard title="Farmer profile" subtitle="Persisted locally for faster launch and offline continuity.">
        <Text style={styles.profileText}>Role: {user?.role || "farmer"}</Text>
        <Text style={styles.profileText}>Location: {user?.location || "Not set"}</Text>
        <Text style={styles.profileText}>
          Primary crops: {user?.primary_crops?.length ? user.primary_crops.join(", ") : "Not set"}
        </Text>
      </SectionCard>

      <SectionCard title="Actions" subtitle="Refresh cached data, push queued feedback, or sign out securely.">
        <PrimaryButton label="Refresh dashboard" loading={loading} onPress={() => void loadSummary()} />
        <PrimaryButton label="Sync queued updates" onPress={() => void handleSync()} tone="secondary" />
        <Pressable onPress={logout}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
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
    padding: 14
  },
  bannerText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metricCard: {
    flexGrow: 1,
    minWidth: "30%",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    padding: 14,
    gap: 6
  },
  metricValue: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: "800"
  },
  metricLabel: {
    color: colors.mutedText,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  contextBlock: {
    marginTop: 8,
    backgroundColor: colors.background,
    borderRadius: 18,
    padding: 14,
    gap: 4
  },
  contextTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  contextText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 19
  },
  profileText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
  },
  signOutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: "700"
  }
});
