import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { colors } from "../theme/colors";

export const LoadingScreen = ({ label }: { label: string }) => {
  const copy = useMobileTranslatedContent({
    title: "KrishiMitra AI",
    label,
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.label}>{copy.label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  label: {
    color: colors.mutedText,
    fontSize: 14,
    textAlign: "center",
  },
});
