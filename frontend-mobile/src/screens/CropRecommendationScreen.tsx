import NetInfo from "@react-native-community/netinfo";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { fetchMobileCropRecommendation } from "../services/api";
import { getCachedCropRecommendation, setCachedCropRecommendation } from "../services/offline";

interface CropRecommendationScreenProps {
  accessToken: string;
  onBack: () => void;
}

const CropRecommendationScreen: React.FC<CropRecommendationScreenProps> = ({ accessToken, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string>("");
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [form, setForm] = useState({
    soil_n: "60",
    soil_p: "40",
    soil_k: "35",
    soil_ph: "6.8",
    temperature_c: "27",
    humidity_pct: "65",
    rainfall_mm: "110",
    location: "Patna",
    season: "kharif",
    historical_yield: "2200",
  });

  const buildSummary = useMemo(
    () => (response: Awaited<ReturnType<typeof fetchMobileCropRecommendation>>) =>
      response.recommendations.map((item) => `${item.crop} (${Math.round(item.confidence * 100)}%)`).join(" | "),
    []
  );

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      const cached = await getCachedCropRecommendation();
      if (cached && mounted) {
        setResult(buildSummary(cached.value));
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
  }, [buildSummary]);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isConnected) {
        const cached = await getCachedCropRecommendation();
        if (cached) {
          setResult(buildSummary(cached.value));
          setCachedAt(cached.ts);
          setError("Offline mode: showing cached result.");
        } else {
          setError("Offline mode: no cached result available.");
        }
        return;
      }
      const response = await fetchMobileCropRecommendation(accessToken, {
        soil_n: Number(form.soil_n),
        soil_p: Number(form.soil_p),
        soil_k: Number(form.soil_k),
        soil_ph: Number(form.soil_ph),
        temperature_c: Number(form.temperature_c),
        humidity_pct: Number(form.humidity_pct),
        rainfall_mm: Number(form.rainfall_mm),
        location: form.location,
        season: form.season,
        historical_yield: Number(form.historical_yield),
      });
      setResult(buildSummary(response));
      await setCachedCropRecommendation(response);
      setCachedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop recommendation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Crop Recommendation</Text>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </View>
      <View style={[styles.networkBadge, isConnected ? styles.onlineBadge : styles.offlineBadge]}>
        <Text style={styles.networkBadgeText}>{isConnected ? "Online" : "Offline"}</Text>
        {cachedAt ? <Text style={styles.cachedText}>Cached: {new Date(cachedAt).toLocaleDateString()}</Text> : null}
      </View>
      <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={(value) => setForm((prev) => ({ ...prev, location: value }))} />
      <TextInput style={styles.input} placeholder="Season" value={form.season} onChangeText={(value) => setForm((prev) => ({ ...prev, season: value }))} />
      <TextInput style={styles.input} placeholder="Soil N" keyboardType="numeric" value={form.soil_n} onChangeText={(value) => setForm((prev) => ({ ...prev, soil_n: value }))} />
      <TextInput style={styles.input} placeholder="Soil P" keyboardType="numeric" value={form.soil_p} onChangeText={(value) => setForm((prev) => ({ ...prev, soil_p: value }))} />
      <TextInput style={styles.input} placeholder="Soil K" keyboardType="numeric" value={form.soil_k} onChangeText={(value) => setForm((prev) => ({ ...prev, soil_k: value }))} />
      <TextInput style={styles.input} placeholder="Soil pH" keyboardType="numeric" value={form.soil_ph} onChangeText={(value) => setForm((prev) => ({ ...prev, soil_ph: value }))} />
      <TextInput style={styles.input} placeholder="Temperature C" keyboardType="numeric" value={form.temperature_c} onChangeText={(value) => setForm((prev) => ({ ...prev, temperature_c: value }))} />
      <TextInput style={styles.input} placeholder="Humidity %" keyboardType="numeric" value={form.humidity_pct} onChangeText={(value) => setForm((prev) => ({ ...prev, humidity_pct: value }))} />
      <TextInput style={styles.input} placeholder="Rainfall mm" keyboardType="numeric" value={form.rainfall_mm} onChangeText={(value) => setForm((prev) => ({ ...prev, rainfall_mm: value }))} />
      <TextInput
        style={styles.input}
        placeholder="Historical yield kg/acre"
        keyboardType="numeric"
        value={form.historical_yield}
        onChangeText={(value) => setForm((prev) => ({ ...prev, historical_yield: value }))}
      />
      <Pressable style={styles.primaryButton} onPress={() => void submit()} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate</Text>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result ? <Text style={styles.result}>{result}</Text> : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f8ef",
  },
  content: {
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
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
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  error: {
    color: "#b00020",
    fontSize: 12,
  },
  result: {
    color: "#1d3325",
    fontSize: 13,
    fontWeight: "600",
  },
});

export default CropRecommendationScreen;
