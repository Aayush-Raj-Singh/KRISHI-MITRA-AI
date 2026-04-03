import React, { useEffect, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import type { CropRecommendationResponse, WaterOptimizationResponse } from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { InlineTabs } from "../components/InlineTabs";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { StatBox } from "../components/StatBox";
import { recommendationApi } from "../services/api";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { openAppRoute } from "../navigation/routeHelpers";
import { colors, spacing, typography } from "../theme";

type ToolId = "crop" | "water";

const toolLabels: Record<ToolId, { title: string; subtitle: string }> = {
  crop: {
    title: "Crop planning",
    subtitle: "Run the same agronomy recommendation workflow used by the web farm-operations tab.",
  },
  water: {
    title: "Water optimization",
    subtitle: "Generate irrigation schedules with weather-aware field planning.",
  },
};

export const FarmOperationsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const forcedTool: ToolId | null =
    route.name === "WaterOptimization"
      ? "water"
      : route.name === "CropRecommendation"
        ? "crop"
        : route.params?.initialTool === "water"
          ? "water"
          : route.params?.initialTool === "crop"
            ? "crop"
            : null;
  const [activeTool, setActiveTool] = useState<ToolId>(forcedTool || "crop");
  const [loadingTool, setLoadingTool] = useState<ToolId | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [cropForm, setCropForm] = useState({
    soil_n: "60",
    soil_p: "40",
    soil_k: "35",
    soil_ph: "6.8",
    temperature_c: "27",
    humidity_pct: "65",
    rainfall_mm: "110",
    location: "Nashik",
    season: "kharif",
    historical_yield: "2.2",
  });
  const [waterForm, setWaterForm] = useState({
    crop: "rice",
    growth_stage: "vegetative",
    soil_moisture_pct: "55",
    water_source: "canal",
    field_area_acres: "4",
    location: "Patna",
  });

  const [cropResult, setCropResult] = useState<CropRecommendationResponse | null>(null);
  const [waterResult, setWaterResult] = useState<WaterOptimizationResponse | null>(null);

  useEffect(() => {
    if (forcedTool) {
      setActiveTool(forcedTool);
    }
  }, [forcedTool]);

  const screenMeta =
    route.name === "CropRecommendation"
      ? {
          title: "Crop recommendation",
          subtitle:
            "Run the same agronomy recommendation workflow used by the web crop recommendation page.",
          eyebrow: "Recommendation Engine",
          heroBadges: ["Soil Inputs", "Climate Signals", "AI Crop Plan"],
        }
      : route.name === "WaterOptimization"
        ? {
            title: "Water optimization",
            subtitle:
              "Generate the same irrigation schedules and water-saving plans shown on the web water optimization page.",
            eyebrow: "Irrigation Planning",
            heroBadges: ["Irrigation Schedule", "Savings Estimate", "Field Planning"],
          }
        : {
            title: "Farm operations",
            subtitle:
              "Crop planning and irrigation optimization mirror the same split workspace used on the web product.",
            eyebrow: "Operations",
            heroBadges: ["Crop Planning", "Water Optimization", "Shared Farm Inputs"],
          };

  const runWithCache = async <T,>(
    scope: string,
    payload: unknown,
    task: () => Promise<T>,
    apply: (value: T) => void,
    tool: ToolId,
  ) => {
    setLoadingTool(tool);
    setMessage(null);
    const cacheKey = buildCacheKey(scope, payload);

    try {
      const response = await task();
      apply(response);
      await writeCacheRecord(cacheKey, response);
      setMessage("Live result refreshed from the backend.");
    } catch (error) {
      const cached = await readCacheRecord<T>(cacheKey);
      if (cached) {
        apply(cached.value);
        setMessage(`Showing cached result from ${new Date(cached.updatedAt).toLocaleString()}.`);
      } else {
        setMessage(
          error instanceof Error ? error.message : "This workflow is unavailable right now.",
        );
      }
    } finally {
      setLoadingTool(null);
    }
  };

  const submitCrop = async () => {
    const payload = {
      soil_n: Number(cropForm.soil_n),
      soil_p: Number(cropForm.soil_p),
      soil_k: Number(cropForm.soil_k),
      soil_ph: Number(cropForm.soil_ph),
      temperature_c: Number(cropForm.temperature_c),
      humidity_pct: Number(cropForm.humidity_pct),
      rainfall_mm: Number(cropForm.rainfall_mm),
      location: cropForm.location,
      season: cropForm.season,
      historical_yield: Number(cropForm.historical_yield),
    };
    await runWithCache(
      "recommendations:crop",
      payload,
      () => recommendationApi.getCropRecommendation(payload),
      setCropResult,
      "crop",
    );
  };

  const submitWater = async () => {
    const payload = {
      crop: waterForm.crop,
      growth_stage: waterForm.growth_stage,
      soil_moisture_pct: Number(waterForm.soil_moisture_pct),
      water_source: waterForm.water_source,
      field_area_acres: Number(waterForm.field_area_acres),
      location: waterForm.location,
    };
    await runWithCache(
      "recommendations:water",
      payload,
      () => recommendationApi.getWaterOptimization(payload),
      setWaterResult,
      "water",
    );
  };

  return (
    <ScreenShell
      title={screenMeta.title}
      subtitle={screenMeta.subtitle}
      eyebrow={screenMeta.eyebrow}
      heroImageSource={require("../../assets/hero-slide-01.png")}
      heroBadges={screenMeta.heroBadges}
    >
      {route.name !== "CropRecommendation" && route.name !== "WaterOptimization" ? (
        <InlineTabs
          activeKey={activeTool}
          items={[
            { key: "crop", label: "Crop planning" },
            { key: "water", label: "Water optimization" },
          ]}
          onChange={(value) => setActiveTool(value as ToolId)}
        />
      ) : null}

      {message ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{message}</Text>
        </View>
      ) : null}

      {activeTool === "crop" ? (
        <SectionCard title={toolLabels.crop.title} subtitle={toolLabels.crop.subtitle}>
          <FieldInput
            label="Soil nitrogen"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, soil_n: value }))}
            value={cropForm.soil_n}
          />
          <FieldInput
            label="Soil phosphorus"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, soil_p: value }))}
            value={cropForm.soil_p}
          />
          <FieldInput
            label="Soil potassium"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, soil_k: value }))}
            value={cropForm.soil_k}
          />
          <FieldInput
            label="Soil pH"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, soil_ph: value }))}
            value={cropForm.soil_ph}
          />
          <FieldInput
            label="Temperature (C)"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, temperature_c: value }))}
            value={cropForm.temperature_c}
          />
          <FieldInput
            label="Humidity (%)"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, humidity_pct: value }))}
            value={cropForm.humidity_pct}
          />
          <FieldInput
            label="Rainfall (mm)"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, rainfall_mm: value }))}
            value={cropForm.rainfall_mm}
          />
          <FieldInput
            label="Location"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, location: value }))}
            value={cropForm.location}
          />
          <FieldInput
            label="Season"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, season: value }))}
            value={cropForm.season}
          />
          <FieldInput
            label="Historical yield"
            keyboardType="decimal-pad"
            onChangeText={(value) => setCropForm((prev) => ({ ...prev, historical_yield: value }))}
            value={cropForm.historical_yield}
          />
          <PrimaryButton
            label="Generate crop plan"
            loading={loadingTool === "crop"}
            onPress={() => void submitCrop()}
          />

          {cropResult ? (
            <View style={styles.resultBlock}>
              {cropResult.recommendations.map((item) => (
                <View key={item.crop} style={styles.resultRow}>
                  <Text style={styles.resultTitle}>
                    {item.crop} | {Math.round(item.confidence * 100)}%
                  </Text>
                  <Text style={styles.resultText}>{item.explanation}</Text>
                </View>
              ))}
              <PrimaryButton
                label="Log outcome feedback"
                onPress={() => openAppRoute(navigation, "Feedback")}
                tone="secondary"
              />
            </View>
          ) : null}
        </SectionCard>
      ) : null}

      {activeTool === "water" ? (
        <SectionCard title={toolLabels.water.title} subtitle={toolLabels.water.subtitle}>
          <FieldInput
            label="Crop"
            onChangeText={(value) => setWaterForm((prev) => ({ ...prev, crop: value }))}
            value={waterForm.crop}
          />
          <FieldInput
            label="Growth stage"
            onChangeText={(value) => setWaterForm((prev) => ({ ...prev, growth_stage: value }))}
            value={waterForm.growth_stage}
          />
          <FieldInput
            label="Soil moisture (%)"
            keyboardType="decimal-pad"
            onChangeText={(value) =>
              setWaterForm((prev) => ({ ...prev, soil_moisture_pct: value }))
            }
            value={waterForm.soil_moisture_pct}
          />
          <FieldInput
            label="Water source"
            onChangeText={(value) => setWaterForm((prev) => ({ ...prev, water_source: value }))}
            value={waterForm.water_source}
          />
          <FieldInput
            label="Field area (acres)"
            keyboardType="decimal-pad"
            onChangeText={(value) => setWaterForm((prev) => ({ ...prev, field_area_acres: value }))}
            value={waterForm.field_area_acres}
          />
          <FieldInput
            label="Location"
            onChangeText={(value) => setWaterForm((prev) => ({ ...prev, location: value }))}
            value={waterForm.location}
          />
          <PrimaryButton
            label="Optimize irrigation"
            loading={loadingTool === "water"}
            onPress={() => void submitWater()}
          />

          {waterResult ? (
            <View style={styles.resultBlock}>
              <View style={styles.statsGrid}>
                <StatBox
                  label="Estimated savings"
                  value={`${waterResult.water_savings_percent.toFixed(1)}%`}
                />
                <StatBox label="Schedule rows" value={`${waterResult.schedule.length}`} />
              </View>
              {waterResult.schedule.slice(0, 5).map((item) => (
                <View key={item.date} style={styles.resultRow}>
                  <Text style={styles.resultTitle}>{item.date}</Text>
                  <Text style={styles.resultText}>
                    {item.irrigation_mm.toFixed(1)} mm | {item.irrigation_liters.toFixed(0)} L
                  </Text>
                  <Text style={styles.resultText}>{item.reason}</Text>
                </View>
              ))}
              {waterResult.notes.map((item) => (
                <Text key={item} style={styles.resultText}>
                  - {item}
                </Text>
              ))}
              <PrimaryButton
                label="Log outcome feedback"
                onPress={() => openAppRoute(navigation, "Feedback")}
                tone="secondary"
              />
            </View>
          ) : null}
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
  resultBlock: {
    marginTop: 8,
    gap: spacing.sm,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
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
