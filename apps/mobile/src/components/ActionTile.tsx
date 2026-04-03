import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, shadows, spacing, typography } from "../theme";

interface ActionTileProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  meta?: string;
  onPress: () => void;
}

export const ActionTile = ({ icon, title, description, meta, onPress }: ActionTileProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
  >
    <View style={styles.iconShell}>
      <MaterialIcons color={colors.primary} name={icon} size={24} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    <View style={styles.footerRow}>
      {meta ? <Text style={styles.meta}>{meta}</Text> : <View />}
      <MaterialIcons color={colors.primary} name="arrow-forward" size={18} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    minHeight: 188,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: "space-between",
    ...shadows.card,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  iconShell: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFont,
    fontSize: typography.titleSm,
    lineHeight: 24,
  },
  description: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 20,
  },
  meta: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
});
