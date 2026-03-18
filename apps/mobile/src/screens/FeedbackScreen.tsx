import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { OutcomeFeedbackResponse } from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { readOfflineQueue } from "../services/storage";
import { submitOutcomeFeedbackOrQueue, syncOfflineQueue } from "../services/offlineSync";
import { colors } from "../theme/colors";

export const FeedbackScreen = () => {
  const [form, setForm] = useState({
    recommendation_id: "",
    rating: "4",
    yield_kg_per_acre: "2100",
    income_inr: "85000",
    water_usage_l_per_acre: "420000",
    fertilizer_kg_per_acre: "105",
    notes: ""
  });
  const [result, setResult] = useState<OutcomeFeedbackResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [queuedItems, setQueuedItems] = useState(0);

  const loadQueueSize = async () => {
    const queue = await readOfflineQueue();
    setQueuedItems(queue.length);
  };

  useEffect(() => {
    void loadQueueSize();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setNotice(null);

    try {
      const response = await submitOutcomeFeedbackOrQueue({
        recommendation_id: form.recommendation_id,
        rating: Number(form.rating),
        yield_kg_per_acre: Number(form.yield_kg_per_acre),
        income_inr: Number(form.income_inr),
        water_usage_l_per_acre: Number(form.water_usage_l_per_acre),
        fertilizer_kg_per_acre: Number(form.fertilizer_kg_per_acre),
        notes: form.notes
      });
      setResult(response);
      setNotice(
        response.feedback_id === "queued"
          ? "Feedback stored offline and queued for sync."
          : "Feedback submitted successfully."
      );
      await loadQueueSize();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to submit feedback.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const processed = await syncOfflineQueue();
      await loadQueueSize();
      setNotice(
        processed > 0 ? `Synced ${processed} queued feedback updates.` : "No queued feedback was waiting to sync."
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to sync queued feedback right now.");
    }
  };

  return (
    <ScreenShell
      title="Outcome feedback"
      subtitle="Capture recommendation outcomes and keep feedback flowing even when the connection drops."
    >
      {notice ? (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <SectionCard title="Submit feedback" subtitle={`Queued updates: ${queuedItems}`}>
        <FieldInput label="Recommendation ID" onChangeText={(value) => setForm((prev) => ({ ...prev, recommendation_id: value }))} value={form.recommendation_id} />
        <FieldInput keyboardType="number-pad" label="Rating (1-5)" onChangeText={(value) => setForm((prev) => ({ ...prev, rating: value }))} value={form.rating} />
        <FieldInput keyboardType="decimal-pad" label="Yield (kg/acre)" onChangeText={(value) => setForm((prev) => ({ ...prev, yield_kg_per_acre: value }))} value={form.yield_kg_per_acre} />
        <FieldInput keyboardType="decimal-pad" label="Income (INR)" onChangeText={(value) => setForm((prev) => ({ ...prev, income_inr: value }))} value={form.income_inr} />
        <FieldInput keyboardType="decimal-pad" label="Water usage (L/acre)" onChangeText={(value) => setForm((prev) => ({ ...prev, water_usage_l_per_acre: value }))} value={form.water_usage_l_per_acre} />
        <FieldInput keyboardType="decimal-pad" label="Fertilizer usage (kg/acre)" onChangeText={(value) => setForm((prev) => ({ ...prev, fertilizer_kg_per_acre: value }))} value={form.fertilizer_kg_per_acre} />
        <FieldInput label="Notes" multiline onChangeText={(value) => setForm((prev) => ({ ...prev, notes: value }))} style={styles.notesInput} value={form.notes} />
        <PrimaryButton label="Submit feedback" loading={loading} onPress={() => void handleSubmit()} />
        <PrimaryButton label="Sync queued feedback" onPress={() => void handleSync()} tone="secondary" />
      </SectionCard>

      {result ? (
        <SectionCard title="Sustainability snapshot" subtitle={`Score ${result.sustainability_score.toFixed(1)}`}>
          <Text style={styles.resultText}>Water efficiency: {result.sub_scores.water_efficiency.toFixed(1)}</Text>
          <Text style={styles.resultText}>Fertilizer efficiency: {result.sub_scores.fertilizer_efficiency.toFixed(1)}</Text>
          <Text style={styles.resultText}>Yield optimization: {result.sub_scores.yield_optimization.toFixed(1)}</Text>
          {result.recommendations.map((item) => (
            <Text key={item} style={styles.resultText}>• {item}</Text>
          ))}
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  noticeBanner: {
    backgroundColor: "#ecf4ee",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c8ddcc",
    padding: 14
  },
  noticeText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  resultText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20
  }
});
