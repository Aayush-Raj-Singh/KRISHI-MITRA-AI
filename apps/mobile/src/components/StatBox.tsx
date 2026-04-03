import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

interface StatBoxProps {
  label: string;
  value: string;
  caption?: string;
}

export const StatBox = ({ label, value, caption }: StatBoxProps) => (
  <View style={styles.card}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
    {caption ? <Text style={styles.caption}>{caption}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    minWidth: "30%",
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 4,
  },
  label: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  value: {
    color: colors.primaryDark,
    fontFamily: typography.headingFont,
    fontSize: typography.titleMd,
  },
  caption: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
