import React, { useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";

import type { DiseasePredictionResponse } from "@krishimitra/shared";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { diseaseApi } from "../services/api";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { colors } from "../theme/colors";

const diseaseCacheKey = buildCacheKey("disease:last-result");

export const DiseaseDetectionScreen = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<DiseasePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const pickImage = async (mode: "camera" | "library") => {
    setNotice(null);

    if (mode === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice("Camera permission is required to capture a disease image.");
        return;
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setNotice("Media library permission is required to select an image.");
        return;
      }
    }

    const action =
      mode === "camera" ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const response = await action({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ["images"]
    });

    if (!response.canceled) {
      setImageUri(response.assets[0]?.uri || null);
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!imageUri) {
      setNotice("Choose or capture an image first.");
      return;
    }

    setLoading(true);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: "leaf.jpg",
        type: "image/jpeg"
      } as any);

      const response = await diseaseApi.predict(formData);
      setResult(response);
      await writeCacheRecord(diseaseCacheKey, response);
    } catch (error) {
      const cached = await readCacheRecord<DiseasePredictionResponse>(diseaseCacheKey);
      if (cached) {
        setResult(cached.value);
        setNotice(`Live detection failed. Showing cached result from ${new Date(cached.updatedAt).toLocaleString()}.`);
      } else {
        setNotice(error instanceof Error ? error.message : "Unable to process the image right now.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Disease detection"
      subtitle="Capture or upload a leaf image and reuse the same backend inference workflow from mobile."
    >
      {notice ? (
        <View style={styles.noticeBanner}>
          <Text style={styles.noticeText}>{notice}</Text>
        </View>
      ) : null}

      <SectionCard title="Image capture" subtitle="Use the camera for field diagnosis or select a saved image.">
        <View style={styles.actionRow}>
          <PrimaryButton label="Use camera" onPress={() => void pickImage("camera")} style={styles.actionButton} />
          <PrimaryButton label="Choose image" onPress={() => void pickImage("library")} tone="secondary" style={styles.actionButton} />
        </View>

        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}
        <PrimaryButton label="Run disease scan" loading={loading} onPress={() => void handleDetect()} />
      </SectionCard>

      {result ? (
        <SectionCard title={`${result.crop} • ${result.disease}`} subtitle={`Confidence ${(result.confidence * 100).toFixed(1)}% • Severity ${result.severity}`}>
          {result.advisory ? <Text style={styles.bodyText}>{result.advisory}</Text> : null}
          <Text style={styles.sectionTitle}>Treatment</Text>
          {result.treatment.map((item) => (
            <Text key={item} style={styles.bodyText}>• {item}</Text>
          ))}
          <Text style={styles.sectionTitle}>Prevention</Text>
          {result.prevention.map((item) => (
            <Text key={item} style={styles.bodyText}>• {item}</Text>
          ))}
          <Text style={styles.sectionTitle}>Organic solutions</Text>
          {result.organic_solutions.map((item) => (
            <Text key={item} style={styles.bodyText}>• {item}</Text>
          ))}
          <Text style={styles.sectionTitle}>Recommended products</Text>
          {result.recommended_products.map((item) => (
            <Text key={item} style={styles.bodyText}>• {item}</Text>
          ))}
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  noticeBanner: {
    backgroundColor: "#fff2df",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ebd0a7",
    padding: 14
  },
  noticeText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  actionButton: {
    flexGrow: 1
  },
  preview: {
    width: "100%",
    height: 220,
    borderRadius: 18
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4
  },
  bodyText: {
    color: colors.mutedText,
    fontSize: 14,
    lineHeight: 20
  }
});
