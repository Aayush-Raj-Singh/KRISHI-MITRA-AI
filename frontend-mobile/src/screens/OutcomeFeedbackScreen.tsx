import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { submitMobileOutcomeFeedback } from "../services/api";

interface OutcomeFeedbackScreenProps {
  accessToken: string;
  onBack: () => void;
}

const OutcomeFeedbackScreen: React.FC<OutcomeFeedbackScreenProps> = ({ accessToken, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [recommendationId, setRecommendationId] = useState("");
  const [rating, setRating] = useState("4");
  const [yieldKg, setYieldKg] = useState("2100");
  const [income, setIncome] = useState("85000");
  const [water, setWater] = useState("420000");
  const [fertilizer, setFertilizer] = useState("105");

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await submitMobileOutcomeFeedback(accessToken, {
        recommendation_id: recommendationId,
        rating: Number(rating),
        yield_kg_per_acre: Number(yieldKg),
        income_inr: Number(income),
        water_usage_l_per_acre: Number(water),
        fertilizer_kg_per_acre: Number(fertilizer),
      });
      setSummary(
        `Sustainability ${response.sustainability_score} | Badge ${response.recognition_badge || "N/A"}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback submit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Outcome Feedback</Text>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
      </View>
      <TextInput style={styles.input} value={recommendationId} onChangeText={setRecommendationId} placeholder="Recommendation ID" />
      <TextInput style={styles.input} value={rating} onChangeText={setRating} placeholder="Rating (1-5)" keyboardType="numeric" />
      <TextInput style={styles.input} value={yieldKg} onChangeText={setYieldKg} placeholder="Yield kg/acre" keyboardType="numeric" />
      <TextInput style={styles.input} value={income} onChangeText={setIncome} placeholder="Income INR" keyboardType="numeric" />
      <TextInput style={styles.input} value={water} onChangeText={setWater} placeholder="Water usage L/acre" keyboardType="numeric" />
      <TextInput style={styles.input} value={fertilizer} onChangeText={setFertilizer} placeholder="Fertilizer kg/acre" keyboardType="numeric" />
      <Pressable style={styles.primaryButton} onPress={() => void submit()} disabled={loading || !recommendationId}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
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

export default OutcomeFeedbackScreen;
