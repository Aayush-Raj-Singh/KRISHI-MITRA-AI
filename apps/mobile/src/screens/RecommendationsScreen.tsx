import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type {
  CropRecommendationResponse,
  PriceForecastResponse,
  WaterOptimizationResponse,
} from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { recommendationApi } from "../services/api";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { colors } from "../theme/colors";

type ToolId = "crop" | "price" | "water";

const toolLabels: Record<ToolId, { title: string; subtitle: string }> = {
  crop: {
    title: "Crop recommendation",
    subtitle: "Run the existing agronomy model with soil, climate, and location inputs.",
  },
  price: {
    title: "Price forecast",
    subtitle: "Query the same price forecasting workflow used by the web platform.",
  },
  water: {
    title: "Water optimization",
    subtitle: "Generate irrigation schedules with weather-aware field planning.",
  },
};

export const RecommendationsScreen = () => {
  const [activeTool, setActiveTool] = useState<ToolId>("crop");
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
  const [priceForm, setPriceForm] = useState({
    crop: "rice",
    market: "Patna",
    currency: "INR",
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
  const [priceResult, setPriceResult] = useState<PriceForecastResponse | null>(null);
  const [waterResult, setWaterResult] = useState<WaterOptimizationResponse | null>(null);

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
        setMessage(error instanceof Error ? error.message : "This tool is unavailable right now.");
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

  const submitPrice = async () => {
    const payload = {
      crop: priceForm.crop,
      market: priceForm.market,
      currency: priceForm.currency,
    };
    await runWithCache(
      "recommendations:price",
      payload,
      () => recommendationApi.getPriceForecast(payload),
      setPriceResult,
      "price",
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

  const renderCrop = () => (
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
                {item.crop} • {Math.round(item.confidence * 100)}%
              </Text>
              <Text style={styles.resultText}>{item.explanation}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </SectionCard>
  );

  const renderPrice = () => {
    const series = priceResult?.series?.[0];

    return (
      <SectionCard title={toolLabels.price.title} subtitle={toolLabels.price.subtitle}>
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
          loading={loadingTool === "price"}
          onPress={() => void submitPrice()}
        />

        {priceResult && series ? (
          <View style={styles.resultBlock}>
            <Text style={styles.resultTitle}>
              {priceResult.crop} • {priceResult.market}
            </Text>
            <Text style={styles.resultText}>MAPE: {priceResult.mape.toFixed(2)}%</Text>
            {series.dates.slice(0, 5).map((date, index) => (
              <View key={date} style={styles.resultRow}>
                <Text style={styles.resultTitle}>{date}</Text>
                <Text style={styles.resultText}>
                  {series.forecast[index].toFixed(2)} {priceResult.currency}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>
    );
  };

  const renderWater = () => (
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
        onChangeText={(value) => setWaterForm((prev) => ({ ...prev, soil_moisture_pct: value }))}
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
          <Text style={styles.resultTitle}>
            Estimated savings: {waterResult.water_savings_percent.toFixed(1)}%
          </Text>
          {waterResult.schedule.slice(0, 5).map((item) => (
            <View key={item.date} style={styles.resultRow}>
              <Text style={styles.resultTitle}>{item.date}</Text>
              <Text style={styles.resultText}>
                {item.irrigation_mm.toFixed(1)} mm • {item.irrigation_liters.toFixed(0)} L
              </Text>
            </View>
          ))}
          {waterResult.notes.map((item) => (
            <Text key={item} style={styles.resultText}>
              {item}
            </Text>
          ))}
        </View>
      ) : null}
    </SectionCard>
  );

  return (
    <ScreenShell
      title="Action plans"
      subtitle="Crop, market, and irrigation workflows powered by the same backend APIs as the web application."
      eyebrow="Planning Workspace"
      heroImageSource={require("../../assets/hero-slide-01.png")}
      heroBadges={["Crop Recommendation", "Price Forecast", "Water Optimization"]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolRow}
      >
        {(Object.keys(toolLabels) as ToolId[]).map((tool) => (
          <Pressable
            key={tool}
            onPress={() => setActiveTool(tool)}
            style={[styles.toolChip, activeTool === tool ? styles.toolChipActive : null]}
          >
            <Text
              style={[styles.toolChipText, activeTool === tool ? styles.toolChipTextActive : null]}
            >
              {toolLabels[tool].title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {message ? (
        <View style={styles.messageBanner}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {activeTool === "crop" ? renderCrop() : null}
      {activeTool === "price" ? renderPrice() : null}
      {activeTool === "water" ? renderWater() : null}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  toolRow: {
    gap: 10,
  },
  toolChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toolChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toolChipText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  toolChipTextActive: {
    color: colors.white,
  },
  messageBanner: {
    backgroundColor: "#ecf4ee",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c8ddcc",
    padding: 14,
  },
  messageText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  resultBlock: {
    marginTop: 8,
    gap: 10,
  },
  resultRow: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  resultTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  resultText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
});
