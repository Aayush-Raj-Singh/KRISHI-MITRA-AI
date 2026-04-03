import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors, radius, shadows, spacing, typography } from "../theme";

interface AuthShowcasePoint {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}

interface AuthShowcaseCardProps {
  title: string;
  subtitle: string;
  points: AuthShowcasePoint[];
}

export const AuthShowcaseCard = ({ title, subtitle, points }: AuthShowcaseCardProps) => (
  <View style={styles.card}>
    <View style={styles.mediaPanel}>
      <Text style={styles.mediaEyebrow}>KrishiMitra Portal</Text>
      <Text style={styles.mediaTitle}>{title}</Text>
      <Text style={styles.mediaSubtitle}>{subtitle}</Text>
    </View>
    <View style={styles.pointsCard}>
      {points.map((point) => (
        <View key={point.text} style={styles.pointRow}>
          <View style={styles.pointIcon}>
            <MaterialIcons color={colors.primary} name={point.icon} size={16} />
          </View>
          <Text style={styles.pointText}>{point.text}</Text>
        </View>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  mediaPanel: {
    borderRadius: radius.xl,
    backgroundColor: colors.primaryDark,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.hero,
  },
  mediaEyebrow: {
    color: "#c6ddcb",
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  mediaTitle: {
    color: colors.white,
    fontFamily: typography.headingFont,
    fontSize: typography.titleLg,
    lineHeight: 38,
  },
  mediaSubtitle: {
    color: "#d7ead9",
    fontSize: typography.body,
    lineHeight: 22,
  },
  pointsCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#d7c7ad",
    backgroundColor: colors.surfaceStrong,
    padding: spacing.md,
    gap: spacing.sm,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  pointIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pointText: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 20,
  },
});
