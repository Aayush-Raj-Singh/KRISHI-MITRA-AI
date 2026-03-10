import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { fetchMobileWaterOptimization, type WaterForecastDay } from "../services/api";
import { getCachedWaterOptimization, setCachedWaterOptimization } from "../services/offline";

interface WaterOptimizationScreenProps {
  accessToken: string;
  onBack: () => void;
}

const toISODate = (date: Date) => date.toISOString().split("T")[0];

const WaterOptimizationScreen: React.FC<WaterOptimizationScreenProps> = ({ accessToken, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [crop, setCrop] = useState("rice");
  const [growthStage, setGrowthStage] = useState("vegetative");
  const [soilMoisture, setSoilMoisture] = useState("55");
  const [waterSource, setWaterSource] = useState("canal");
  const [fieldArea, setFieldArea] = useState("4");

  const forecast = useMemo<WaterForecastDay[]>(() => {
    const now = new Date();
    return Array.from({ length: 5 }).map((_, index) => {
      const day = new Date(now);
      day.setDate(day.getDate() + index + 1);
      return {
        date: toISODate(day),
        rainfall_mm: 3 + index,
        temperature_c: 28 + index * 0.4,
      };
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const cached = await getCachedWaterOptimization();
      if (cached && mounted) {
        setSummary(
          `Savings ${cached.value.water_savings_percent}% | Volume ${Math.round(cached.value.total_volume_liters)} L`
        );
        setCachedAt(cached.ts);
      }
    };
    bootstrap();
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(online);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isConnected) {
        const cached = await getCachedWaterOptimization();
        if (cached) {
          setSummary(
            `Savings ${cached.value.water_savings_percent}% | Volume ${Math.round(
              cached.value.total_volume_liters
            )} L`
          );
          setCachedAt(cached.ts);
          setError("Offline mode: showing cached schedule.");
        } else {
          setError("Offline mode: no cached schedule available.");
        }
        return;
      }
      const response = await fetchMobileWaterOptimization(accessToken, {
        crop,
        growth_stage: growthStage,
        soil_moisture_pct: Number(soilMoisture),
        water_source: waterSource,
        field_area_acres: Number(fieldArea),
        forecast,
      });
      setSummary(
        `Savings ${response.water_savings_percent}% | Volume ${Math.round(response.total_volume_liters)} L`
      );
      await setCachedWaterOptimization(response);
      setCachedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Water optimization failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Water Optimization</Text>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </View>
      <View style={[styles.networkBadge, isConnected ? styles.onlineBadge : styles.offlineBadge]}>
        <Text style={styles.networkBadgeText}>{isConnected ? "Online" : "Offline"}</Text>
        {cachedAt ? <Text style={styles.cachedText}>Cached: {new Date(cachedAt).toLocaleDateString()}</Text> : null}
      </View>
      <TextInput style={styles.input} value={crop} onChangeText={setCrop} placeholder="Crop" />
      <TextInput style={styles.input} value={growthStage} onChangeText={setGrowthStage} placeholder="Growth stage" />
      <TextInput style={styles.input} value={soilMoisture} onChangeText={setSoilMoisture} placeholder="Soil moisture %" keyboardType="numeric" />
      <TextInput style={styles.input} value={waterSource} onChangeText={setWaterSource} placeholder="Water source" />
      <TextInput style={styles.input} value={fieldArea} onChangeText={setFieldArea} placeholder="Field area acres" keyboardType="numeric" />
      <Pressable style={styles.primaryButton} onPress={() => void submit()} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate</Text>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {summary ? <Text style={styles.summary}>{summary}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f8ef",
    padding: 16,
    gap: 10,
  },
  networkBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(27, 107, 58, 0.1)",
  },
  onlineBadge: {
    backgroundColor: "rgba(27, 107, 58, 0.1)",
  },
  offlineBadge: {
    backgroundColor: "rgba(181, 93, 42, 0.18)",
  },
  networkBadgeText: {
    color: "#204430",
    fontWeight: "600",
    fontSize: 12,
  },
  cachedText: {
    color: "#204430",
    fontWeight: "600",
    fontSize: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0d5d33",
  },
  back: {
    color: "#1b6b3a",
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#c9d5c8",
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  primaryButton: {
    backgroundColor: "#1b6b3a",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
    fontSize: 12,
  },
  summary: {
    color: "#1d3325",
    fontWeight: "600",
  },
});

export default WaterOptimizationScreen;
