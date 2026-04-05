import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FieldInput } from "../components/FieldInput";
import { ForbiddenScreen } from "./ForbiddenScreen";
import { InfoPill } from "../components/InfoPill";
import { OptionChips } from "../components/OptionChips";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { StatBox } from "../components/StatBox";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import {
  marketApi,
  operationsApi,
  type DataQualityIssue,
  type DataQualityReport,
  withRetry,
} from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";
import { buildMandiOptions } from "../utils/mandiOptions";

export const DataQualityScreen = () => {
  const role = useAuthStore((state) => state.user?.role);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [directory, setDirectory] = useState<any[]>([]);
  const [recentIssues, setRecentIssues] = useState<DataQualityIssue[]>([]);
  const [report, setReport] = useState<DataQualityReport | null>(null);
  const [filters, setFilters] = useState({
    state: "",
    district: "",
    mandi: "",
    commodity: "",
    date_from: "",
    date_to: "",
  });

  if (role !== "admin") {
    return (
      <ForbiddenScreen description="Your account does not have permission to use the data-quality monitor on mobile." />
    );
  }

  const copy = useMobileTranslatedContent({
    runError: "Unable to run quality checks.",
    noRecentIssues: "No recent issues reported.",
  });
  const translatedNotice = useMobileTranslatedContent({ notice: notice || "" }).notice;

  useEffect(() => {
    withRetry(() => marketApi.getMandiDirectory({ limit: 200 }))
      .then(setDirectory)
      .catch(() => undefined);

    withRetry(() => operationsApi.getQualityIssues())
      .then(setRecentIssues)
      .catch(() => undefined);
  }, []);

  const options = useMemo(() => buildMandiOptions(directory), [directory]);
  const districtOptions = useMemo(
    () => options.getDistrictsForState(filters.state),
    [filters.state, options],
  );
  const mandiOptions = useMemo(
    () => options.getMandisForDistrict(filters.state, filters.district),
    [filters.state, filters.district, options],
  );

  const runChecks = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const response = await withRetry(() =>
        operationsApi.getQualityReport({
          state: filters.state || undefined,
          district: filters.district || undefined,
          mandi: filters.mandi || undefined,
          commodity: filters.commodity || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
        }),
      );
      setReport(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.runError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Data quality"
      subtitle="Run validation checks, inspect severity, and review recent data issues from the same backend quality APIs used on web."
      eyebrow="Governance"
      heroImageSource={require("../../assets/hero-slide-05.jpg")}
      heroBadges={["Validation Checks", "Severity Review", "Issue Feed"]}
    >
      <SectionCard
        title="Validation filters"
        subtitle="Filter by geography, mandi, commodity, and date range before running checks."
      >
        <FieldInput
          helperText="Pick from the quick chips or enter a custom value."
          label="State"
          onChangeText={(value) =>
            setFilters((prev) => ({ ...prev, state: value, district: "", mandi: "" }))
          }
          value={filters.state}
        />
        <OptionChips
          items={options.states}
          selected={filters.state}
          onSelect={(value) =>
            setFilters((prev) => ({ ...prev, state: value, district: "", mandi: "" }))
          }
        />
        <FieldInput
          helperText="District list is derived from the mandi directory."
          label="District"
          onChangeText={(value) => setFilters((prev) => ({ ...prev, district: value, mandi: "" }))}
          value={filters.district}
        />
        <OptionChips
          items={districtOptions}
          selected={filters.district}
          onSelect={(value) => setFilters((prev) => ({ ...prev, district: value, mandi: "" }))}
        />
        <FieldInput
          label="Mandi"
          onChangeText={(value) => setFilters((prev) => ({ ...prev, mandi: value }))}
          value={filters.mandi}
        />
        <OptionChips
          items={mandiOptions}
          selected={filters.mandi}
          onSelect={(value) => setFilters((prev) => ({ ...prev, mandi: value }))}
        />
        <FieldInput
          helperText="Commodity suggestions come from the same directory dataset as market intelligence."
          label="Commodity"
          onChangeText={(value) => setFilters((prev) => ({ ...prev, commodity: value }))}
          value={filters.commodity}
        />
        <OptionChips
          items={options.commodities}
          selected={filters.commodity}
          onSelect={(value) => setFilters((prev) => ({ ...prev, commodity: value }))}
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
        <PrimaryButton
          label="Run quality checks"
          loading={loading}
          onPress={() => void runChecks()}
        />
        {notice ? <Text style={styles.notice}>{translatedNotice}</Text> : null}
      </SectionCard>

      {report ? (
        <SectionCard
          title="Quality summary"
          subtitle="Same issue totals and severity distribution used by the web quality monitor."
        >
          <View style={styles.statsGrid}>
            <StatBox label="Total issues" value={`${report.summary.total}`} />
            <StatBox
              label="Severities"
              value={`${Object.keys(report.summary.by_severity || {}).length}`}
            />
            <StatBox label="Types" value={`${Object.keys(report.summary.by_type || {}).length}`} />
          </View>
          <View style={styles.pillRow}>
            {Object.entries(report.summary.by_severity || {}).map(([level, count]) => (
              <InfoPill
                key={level}
                label={`${level}: ${count}`}
                tone={level === "high" ? "accent" : "default"}
              />
            ))}
          </View>
        </SectionCard>
      ) : null}

      {report?.issues?.length ? (
        <SectionCard
          title="Latest findings"
          subtitle="Recent issues from the generated report are presented as scan-friendly cards."
        >
          {report.issues.slice(0, 12).map((issue) => (
            <View
              key={`${issue.issue_type}-${issue.entry_id || issue.detected_at}`}
              style={styles.row}
            >
              <View style={styles.rowHeader}>
                <InfoPill
                  label={issue.severity}
                  tone={issue.severity === "high" ? "accent" : "default"}
                />
                <Text style={styles.title}>{issue.issue_type}</Text>
              </View>
              <Text style={styles.meta}>{issue.message}</Text>
              <Text style={styles.meta}>{new Date(issue.detected_at).toLocaleString()}</Text>
            </View>
          ))}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Recent issues feed"
        subtitle="Independent issue feed from the same endpoint the web monitor uses below the report summary."
      >
        {recentIssues.length === 0 ? (
          <Text style={styles.empty}>{copy.noRecentIssues}</Text>
        ) : null}
        {recentIssues.slice(0, 8).map((issue, index) => (
          <View key={`${issue.issue_type}-${issue.detected_at}-${index}`} style={styles.row}>
            <Text style={styles.title}>{issue.issue_type}</Text>
            <Text style={styles.meta}>{issue.message}</Text>
            <Text style={styles.meta}>{new Date(issue.detected_at).toLocaleString()}</Text>
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  row: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: spacing.md,
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.xs,
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
  empty: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
