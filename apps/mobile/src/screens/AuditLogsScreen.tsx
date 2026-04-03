import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { InfoPill } from "../components/InfoPill";
import { PrimaryButton } from "../components/PrimaryButton";
import { ForbiddenScreen } from "./ForbiddenScreen";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { operationsApi, type AuditLogRecord, withRetry } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";

export const AuditLogsScreen = () => {
  const role = useAuthStore((state) => state.user?.role);
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  if (role !== "admin") {
    return (
      <ForbiddenScreen description="Your account does not have permission to view audit logs on mobile." />
    );
  }

  const loadLogs = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const response = await withRetry(() => operationsApi.getAuditLogs({ limit: 200 }));
      setLogs(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load audit logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs();
  }, []);

  return (
    <ScreenShell
      title="Audit logs"
      subtitle="Administrative activity, actors, and timestamps from the same audit feed used by the web console."
      eyebrow="Governance"
      heroImageSource={require("../../assets/hero-slide-05.jpg")}
      heroBadges={["Audit Stream", "Actor Trace", "Governance Events"]}
    >
      <SectionCard
        title="Audit stream"
        subtitle="Use refresh to pull the latest governance events from the backend."
      >
        <PrimaryButton
          label="Refresh audit logs"
          loading={loading}
          onPress={() => void loadLogs()}
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <InfoPill label={`${logs.length} records loaded`} tone="accent" />
      </SectionCard>

      <SectionCard
        title="Recent events"
        subtitle="Action, entity, actor, role, and timestamp cards mirror the web layout hierarchy."
      >
        {logs.length === 0 && !loading ? (
          <Text style={styles.empty}>No audit records available yet.</Text>
        ) : null}
        {logs.map((log, index) => (
          <View key={log._id || log.id || `${log.action}-${index}`} style={styles.row}>
            <Text style={styles.title}>
              {log.action} • {log.entity}
            </Text>
            <Text style={styles.meta}>
              Actor: {log.actor_id || "system"} ({log.actor_role || "unknown"})
            </Text>
            <Text style={styles.meta}>
              {log.ts ? new Date(log.ts).toLocaleString() : "Timestamp unavailable"}
            </Text>
          </View>
        ))}
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  notice: {
    color: colors.error,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  empty: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
  row: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: spacing.md,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
