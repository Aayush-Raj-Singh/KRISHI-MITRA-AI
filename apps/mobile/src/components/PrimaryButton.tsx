import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { colors, radius, shadows, spacing, typography } from "../theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "primary" | "secondary";
  style?: ViewStyle;
}

export const PrimaryButton = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  tone = "primary",
  style,
}: PrimaryButtonProps) => {
  const copy = useMobileTranslatedContent({ label });

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        tone === "secondary" ? styles.secondary : styles.primary,
        (disabled || loading) && styles.disabled,
        pressed && !(disabled || loading) ? styles.pressed : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tone === "secondary" ? colors.primary : colors.white} />
      ) : null}
      <Text style={[styles.label, tone === "secondary" ? styles.secondaryLabel : null]}>
        {copy.label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.card,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
  },
  label: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  secondaryLabel: {
    color: colors.primary,
  },
});
