import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { FieldInput } from "../components/FieldInput";
import { ForbiddenScreen } from "./ForbiddenScreen";
import { InlineTabs } from "../components/InlineTabs";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { StatBox } from "../components/StatBox";
import { masterDataApi, withRetry } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";

type TabKey = "commodities" | "varieties" | "grades" | "units" | "seasons" | "msp";

type MasterDatasets = {
  commodities: Record<string, any>[];
  varieties: Record<string, any>[];
  grades: Record<string, any>[];
  units: Record<string, any>[];
  seasons: Record<string, any>[];
  msp: Record<string, any>[];
};

const emptyDatasets: MasterDatasets = {
  commodities: [],
  varieties: [],
  grades: [],
  units: [],
  seasons: [],
  msp: [],
};

export const AdminMasterDataScreen = () => {
  const role = useAuthStore((state) => state.user?.role);
  const [activeTab, setActiveTab] = useState<TabKey>("commodities");
  const [datasets, setDatasets] = useState<MasterDatasets>(emptyDatasets);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [commodityForm, setCommodityForm] = useState({ name: "", code: "", categories: "" });
  const [varietyForm, setVarietyForm] = useState({ commodity_id: "", name: "", code: "" });
  const [gradeForm, setGradeForm] = useState({ commodity_id: "", name: "", code: "" });
  const [unitForm, setUnitForm] = useState({ name: "", symbol: "", type: "" });
  const [seasonForm, setSeasonForm] = useState({ name: "", start_month: "", end_month: "" });
  const [mspForm, setMspForm] = useState({
    commodity_id: "",
    variety_id: "",
    season: "",
    price_per_quintal: "",
    source: "",
    effective_from: "",
  });

  if (role !== "admin") {
    return (
      <ForbiddenScreen description="Your account does not have permission to manage master data on mobile." />
    );
  }

  const loadAll = async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [commodities, varieties, grades, units, seasons, msp] = await Promise.all([
        withRetry(() => masterDataApi.getCommodities()),
        withRetry(() => masterDataApi.getVarieties()),
        withRetry(() => masterDataApi.getGrades()),
        withRetry(() => masterDataApi.getUnits()),
        withRetry(() => masterDataApi.getSeasons()),
        withRetry(() => masterDataApi.getMspRates()),
      ]);
      setDatasets({ commodities, varieties, grades, units, seasons, msp });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load master data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Commodities", value: `${datasets.commodities.length}` },
      { label: "Varieties", value: `${datasets.varieties.length}` },
      { label: "Grades", value: `${datasets.grades.length}` },
      { label: "Units", value: `${datasets.units.length}` },
      { label: "Seasons", value: `${datasets.seasons.length}` },
      { label: "MSP rows", value: `${datasets.msp.length}` },
    ],
    [datasets],
  );

  const submitActiveForm = async () => {
    setLoading(true);
    setNotice(null);
    try {
      if (activeTab === "commodities") {
        await withRetry(() =>
          masterDataApi.createCommodity({
            name: commodityForm.name,
            code: commodityForm.code,
            categories: commodityForm.categories
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            active: true,
          }),
        );
        setCommodityForm({ name: "", code: "", categories: "" });
      } else if (activeTab === "varieties") {
        await withRetry(() =>
          masterDataApi.createVariety({
            commodity_id: varietyForm.commodity_id,
            name: varietyForm.name,
            code: varietyForm.code,
            active: true,
          }),
        );
        setVarietyForm({ commodity_id: "", name: "", code: "" });
      } else if (activeTab === "grades") {
        await withRetry(() =>
          masterDataApi.createGrade({
            commodity_id: gradeForm.commodity_id,
            name: gradeForm.name,
            code: gradeForm.code,
            active: true,
          }),
        );
        setGradeForm({ commodity_id: "", name: "", code: "" });
      } else if (activeTab === "units") {
        await withRetry(() =>
          masterDataApi.createUnit({
            name: unitForm.name,
            symbol: unitForm.symbol,
            type: unitForm.type,
          }),
        );
        setUnitForm({ name: "", symbol: "", type: "" });
      } else if (activeTab === "seasons") {
        await withRetry(() =>
          masterDataApi.createSeason({
            name: seasonForm.name,
            start_month: Number(seasonForm.start_month),
            end_month: Number(seasonForm.end_month),
            active: true,
          }),
        );
        setSeasonForm({ name: "", start_month: "", end_month: "" });
      } else if (activeTab === "msp") {
        await withRetry(() =>
          masterDataApi.createMspRate({
            commodity_id: mspForm.commodity_id,
            variety_id: mspForm.variety_id || undefined,
            season: mspForm.season,
            price_per_quintal: Number(mspForm.price_per_quintal),
            source: mspForm.source || undefined,
            effective_from: mspForm.effective_from || undefined,
          }),
        );
        setMspForm({
          commodity_id: "",
          variety_id: "",
          season: "",
          price_per_quintal: "",
          source: "",
          effective_from: "",
        });
      }
      await loadAll();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to save the master data record.");
      setLoading(false);
    }
  };

  const activeRows = datasets[activeTab];

  return (
    <ScreenShell
      title="Admin master data"
      subtitle="Commodities, varieties, grades, units, seasons, and MSP are available on mobile with the same backend master-data APIs as web."
      eyebrow="Administration"
      heroImageSource={require("../../assets/hero-slide-03.png")}
      heroBadges={["Catalog Editor", "MSP Rates", "Commodities + Grades"]}
    >
      <SectionCard
        title="Inventory summary"
        subtitle="Counts across all master-data catalogs keep the mobile admin view aligned with web."
      >
        <View style={styles.statsGrid}>
          {stats.map((item) => (
            <StatBox key={item.label} label={item.label} value={item.value} />
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Catalog editor"
        subtitle="Switch tabs to create new records and review the current list for each master-data area."
      >
        <InlineTabs
          activeKey={activeTab}
          items={[
            { key: "commodities", label: "Commodities" },
            { key: "varieties", label: "Varieties" },
            { key: "grades", label: "Grades" },
            { key: "units", label: "Units" },
            { key: "seasons", label: "Seasons" },
            { key: "msp", label: "MSP" },
          ]}
          onChange={(value) => setActiveTab(value as TabKey)}
        />

        {activeTab === "commodities" ? (
          <>
            <FieldInput
              label="Name"
              onChangeText={(value) => setCommodityForm((prev) => ({ ...prev, name: value }))}
              value={commodityForm.name}
            />
            <FieldInput
              label="Code"
              onChangeText={(value) => setCommodityForm((prev) => ({ ...prev, code: value }))}
              value={commodityForm.code}
            />
            <FieldInput
              helperText="Comma separated categories."
              label="Categories"
              onChangeText={(value) => setCommodityForm((prev) => ({ ...prev, categories: value }))}
              value={commodityForm.categories}
            />
          </>
        ) : null}

        {activeTab === "varieties" ? (
          <>
            <FieldInput
              label="Commodity ID"
              onChangeText={(value) => setVarietyForm((prev) => ({ ...prev, commodity_id: value }))}
              value={varietyForm.commodity_id}
            />
            <FieldInput
              label="Name"
              onChangeText={(value) => setVarietyForm((prev) => ({ ...prev, name: value }))}
              value={varietyForm.name}
            />
            <FieldInput
              label="Code"
              onChangeText={(value) => setVarietyForm((prev) => ({ ...prev, code: value }))}
              value={varietyForm.code}
            />
          </>
        ) : null}

        {activeTab === "grades" ? (
          <>
            <FieldInput
              label="Commodity ID"
              onChangeText={(value) => setGradeForm((prev) => ({ ...prev, commodity_id: value }))}
              value={gradeForm.commodity_id}
            />
            <FieldInput
              label="Name"
              onChangeText={(value) => setGradeForm((prev) => ({ ...prev, name: value }))}
              value={gradeForm.name}
            />
            <FieldInput
              label="Code"
              onChangeText={(value) => setGradeForm((prev) => ({ ...prev, code: value }))}
              value={gradeForm.code}
            />
          </>
        ) : null}

        {activeTab === "units" ? (
          <>
            <FieldInput
              label="Name"
              onChangeText={(value) => setUnitForm((prev) => ({ ...prev, name: value }))}
              value={unitForm.name}
            />
            <FieldInput
              label="Symbol"
              onChangeText={(value) => setUnitForm((prev) => ({ ...prev, symbol: value }))}
              value={unitForm.symbol}
            />
            <FieldInput
              label="Type"
              onChangeText={(value) => setUnitForm((prev) => ({ ...prev, type: value }))}
              value={unitForm.type}
            />
          </>
        ) : null}

        {activeTab === "seasons" ? (
          <>
            <FieldInput
              label="Name"
              onChangeText={(value) => setSeasonForm((prev) => ({ ...prev, name: value }))}
              value={seasonForm.name}
            />
            <FieldInput
              keyboardType="number-pad"
              label="Start month"
              onChangeText={(value) => setSeasonForm((prev) => ({ ...prev, start_month: value }))}
              value={seasonForm.start_month}
            />
            <FieldInput
              keyboardType="number-pad"
              label="End month"
              onChangeText={(value) => setSeasonForm((prev) => ({ ...prev, end_month: value }))}
              value={seasonForm.end_month}
            />
          </>
        ) : null}

        {activeTab === "msp" ? (
          <>
            <FieldInput
              label="Commodity ID"
              onChangeText={(value) => setMspForm((prev) => ({ ...prev, commodity_id: value }))}
              value={mspForm.commodity_id}
            />
            <FieldInput
              label="Variety ID"
              onChangeText={(value) => setMspForm((prev) => ({ ...prev, variety_id: value }))}
              value={mspForm.variety_id}
            />
            <FieldInput
              label="Season"
              onChangeText={(value) => setMspForm((prev) => ({ ...prev, season: value }))}
              value={mspForm.season}
            />
            <FieldInput
              keyboardType="decimal-pad"
              label="Price per quintal"
              onChangeText={(value) =>
                setMspForm((prev) => ({ ...prev, price_per_quintal: value }))
              }
              value={mspForm.price_per_quintal}
            />
            <FieldInput
              label="Source"
              onChangeText={(value) => setMspForm((prev) => ({ ...prev, source: value }))}
              value={mspForm.source}
            />
            <FieldInput
              helperText="YYYY-MM-DD"
              label="Effective from"
              onChangeText={(value) => setMspForm((prev) => ({ ...prev, effective_from: value }))}
              value={mspForm.effective_from}
            />
          </>
        ) : null}

        <PrimaryButton
          label="Save record"
          loading={loading}
          onPress={() => void submitActiveForm()}
        />
        <PrimaryButton label="Refresh catalogs" onPress={() => void loadAll()} tone="secondary" />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </SectionCard>

      <SectionCard
        title="Current rows"
        subtitle="The list below mirrors the web master-data table in compact mobile cards."
      >
        {activeRows.length === 0 && !loading ? (
          <Text style={styles.empty}>No records found for this catalog.</Text>
        ) : null}
        {activeRows.slice(0, 40).map((row, index) => (
          <View key={String(row._id || row.id || row.name || index)} style={styles.row}>
            <Text style={styles.title}>
              {row.name || row.season || row.market || row.commodity_id || "Record"}
            </Text>
            <Text style={styles.meta}>
              {row.code || row.symbol || row.price_per_quintal || "-"}
            </Text>
            <Text style={styles.meta}>{row.active === false ? "Inactive" : "Active"}</Text>
          </View>
        ))}
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
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
