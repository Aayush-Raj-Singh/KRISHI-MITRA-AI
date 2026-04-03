import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FieldInput } from "../components/FieldInput";
import { ForbiddenScreen } from "./ForbiddenScreen";
import { InfoPill } from "../components/InfoPill";
import { OptionChips } from "../components/OptionChips";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { marketApi, operationsApi, type MandiEntry, withRetry } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";
import { buildMandiOptions } from "../utils/mandiOptions";

const uniqueValues = (items: string[]) =>
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));

export const OfficerWorkflowScreen = () => {
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === "admin";
  const [directory, setDirectory] = useState<any[]>([]);
  const [entries, setEntries] = useState<MandiEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewReason, setReviewReason] = useState("");
  const [form, setForm] = useState({
    state: "",
    district: "",
    commodity: "",
    variety: "",
    grade: "",
    market: "",
    arrival_date: "",
    min_price: "",
    max_price: "",
    modal_price: "",
    arrivals_qtl: "",
  });

  if (role !== "admin" && role !== "extension_officer") {
    return (
      <ForbiddenScreen description="Your account does not have permission to access the officer workflow on mobile." />
    );
  }

  const loadEntries = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const response = await withRetry(() => operationsApi.getMandiEntries({ limit: 50 }));
      setEntries(response.items);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load mandi entries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    withRetry(() => marketApi.getMandiDirectory({ limit: 200 }))
      .then(setDirectory)
      .catch(() => undefined);
    void loadEntries();
  }, []);

  const options = useMemo(() => buildMandiOptions(directory), [directory]);
  const districtOptions = useMemo(
    () => options.getDistrictsForState(form.state),
    [form.state, options],
  );
  const mandiOptions = useMemo(
    () => options.getMandisForDistrict(form.state, form.district),
    [form.state, form.district, options],
  );
  const varietyOptions = useMemo(
    () => uniqueValues(entries.map((entry) => entry.variety || "")),
    [entries],
  );
  const gradeOptions = useMemo(
    () => uniqueValues(entries.map((entry) => entry.grade || "")),
    [entries],
  );

  const handleCreate = async () => {
    setLoading(true);
    setNotice(null);
    try {
      await withRetry(() =>
        operationsApi.createMandiEntry({
          ...form,
          min_price: Number(form.min_price),
          max_price: Number(form.max_price),
          modal_price: Number(form.modal_price),
          arrivals_qtl: Number(form.arrivals_qtl),
        }),
      );
      setForm({
        state: "",
        district: "",
        commodity: "",
        variety: "",
        grade: "",
        market: "",
        arrival_date: "",
        min_price: "",
        max_price: "",
        modal_price: "",
        arrivals_qtl: "",
      });
      await loadEntries();
      setNotice("Draft mandi entry saved.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create the mandi entry.");
      setLoading(false);
    }
  };

  const submitEntry = async (entryId: string) => {
    setLoading(true);
    setNotice(null);
    try {
      await withRetry(() => operationsApi.submitMandiEntry(entryId));
      await loadEntries();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit the entry.");
      setLoading(false);
    }
  };

  const approveEntry = async (entryId: string) => {
    setLoading(true);
    setNotice(null);
    try {
      await withRetry(() => operationsApi.approveMandiEntry(entryId));
      await loadEntries();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to approve the entry.");
      setLoading(false);
    }
  };

  const rejectEntry = async (entryId: string) => {
    setLoading(true);
    setNotice(null);
    try {
      await withRetry(() => operationsApi.rejectMandiEntry(entryId, reviewReason || undefined));
      await loadEntries();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to reject the entry.");
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Officer workflow"
      subtitle="Draft mandi entries, submit approvals, and review field-market records from the same officer flow available on web."
      eyebrow="Field Operations"
      heroImageSource={require("../../assets/hero-slide-07.jpg")}
      heroBadges={["Mandi Entry", "Approval Queue", "Field-Market Records"]}
    >
      <SectionCard
        title="Create mandi entry"
        subtitle="State, district, market, commodity, grade, and price capture match the web officer form."
      >
        <FieldInput
          helperText="Quick suggestions are loaded from the mandi directory."
          label="State"
          onChangeText={(value) =>
            setForm((prev) => ({ ...prev, state: value, district: "", market: "" }))
          }
          value={form.state}
        />
        <OptionChips
          items={options.states}
          selected={form.state}
          onSelect={(value) =>
            setForm((prev) => ({ ...prev, state: value, district: "", market: "" }))
          }
        />
        <FieldInput
          label="District"
          onChangeText={(value) => setForm((prev) => ({ ...prev, district: value, market: "" }))}
          value={form.district}
        />
        <OptionChips
          items={districtOptions}
          selected={form.district}
          onSelect={(value) => setForm((prev) => ({ ...prev, district: value, market: "" }))}
        />
        <FieldInput
          label="Mandi"
          onChangeText={(value) => setForm((prev) => ({ ...prev, market: value }))}
          value={form.market}
        />
        <OptionChips
          items={mandiOptions}
          selected={form.market}
          onSelect={(value) => setForm((prev) => ({ ...prev, market: value }))}
        />
        <FieldInput
          label="Commodity"
          onChangeText={(value) => setForm((prev) => ({ ...prev, commodity: value }))}
          value={form.commodity}
        />
        <OptionChips
          items={options.commodities}
          selected={form.commodity}
          onSelect={(value) => setForm((prev) => ({ ...prev, commodity: value }))}
        />
        <FieldInput
          label="Variety"
          onChangeText={(value) => setForm((prev) => ({ ...prev, variety: value }))}
          value={form.variety}
        />
        <OptionChips
          items={varietyOptions}
          selected={form.variety}
          onSelect={(value) => setForm((prev) => ({ ...prev, variety: value }))}
        />
        <FieldInput
          label="Grade"
          onChangeText={(value) => setForm((prev) => ({ ...prev, grade: value }))}
          value={form.grade}
        />
        <OptionChips
          items={gradeOptions}
          selected={form.grade}
          onSelect={(value) => setForm((prev) => ({ ...prev, grade: value }))}
        />
        <FieldInput
          helperText="YYYY-MM-DD"
          label="Arrival date"
          onChangeText={(value) => setForm((prev) => ({ ...prev, arrival_date: value }))}
          value={form.arrival_date}
        />
        <FieldInput
          keyboardType="decimal-pad"
          label="Min price"
          onChangeText={(value) => setForm((prev) => ({ ...prev, min_price: value }))}
          value={form.min_price}
        />
        <FieldInput
          keyboardType="decimal-pad"
          label="Max price"
          onChangeText={(value) => setForm((prev) => ({ ...prev, max_price: value }))}
          value={form.max_price}
        />
        <FieldInput
          keyboardType="decimal-pad"
          label="Modal price"
          onChangeText={(value) => setForm((prev) => ({ ...prev, modal_price: value }))}
          value={form.modal_price}
        />
        <FieldInput
          keyboardType="decimal-pad"
          label="Arrivals (qtl)"
          onChangeText={(value) => setForm((prev) => ({ ...prev, arrivals_qtl: value }))}
          value={form.arrivals_qtl}
        />
        {isAdmin ? (
          <FieldInput
            helperText="Optional reason used when rejecting submitted entries."
            label="Review note"
            onChangeText={setReviewReason}
            value={reviewReason}
          />
        ) : null}
        <PrimaryButton label="Save draft" loading={loading} onPress={() => void handleCreate()} />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </SectionCard>

      <SectionCard
        title="Recent entries"
        subtitle="Draft, submitted, approved, and rejected entries are visible in the same workflow stage order as web."
      >
        {entries.length === 0 && !loading ? (
          <Text style={styles.empty}>No mandi entries yet.</Text>
        ) : null}
        {entries.map((entry) => (
          <View key={entry._id} style={styles.row}>
            <View style={styles.rowHeader}>
              <Text style={styles.title}>{entry.market}</Text>
              <InfoPill
                label={entry.status}
                tone={
                  entry.status === "approved"
                    ? "success"
                    : entry.status === "submitted"
                      ? "accent"
                      : "default"
                }
              />
            </View>
            <Text style={styles.meta}>
              {entry.commodity} • {entry.arrival_date}
            </Text>
            <Text style={styles.meta}>
              Modal {entry.modal_price} • Arrivals {entry.arrivals_qtl} qtl
            </Text>
            {entry.status === "draft" ? (
              <PrimaryButton
                label="Submit for approval"
                onPress={() => void submitEntry(entry._id)}
                tone="secondary"
              />
            ) : null}
            {entry.status === "submitted" && isAdmin ? (
              <View style={styles.actionRow}>
                <PrimaryButton label="Approve" onPress={() => void approveEntry(entry._id)} />
                <PrimaryButton
                  label="Reject"
                  onPress={() => void rejectEntry(entry._id)}
                  tone="secondary"
                />
              </View>
            ) : null}
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
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    flex: 1,
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
});
