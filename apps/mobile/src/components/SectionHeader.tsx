import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "../theme";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}

export const SectionHeader = ({
  title,
  subtitle,
  actionLabel,
  onPressAction,
}: SectionHeaderProps) => (
  <View style={styles.row}>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {actionLabel && onPressAction ? (
      <Pressable onPress={onPressAction}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFont,
    fontSize: typography.titleSm,
    lineHeight: 24,
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  action: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
  },
});
