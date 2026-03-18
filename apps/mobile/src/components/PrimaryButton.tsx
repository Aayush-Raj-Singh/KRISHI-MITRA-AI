import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { colors } from "../theme/colors";

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
  style
}: PrimaryButtonProps) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled || loading}
    style={({ pressed }) => [
      styles.base,
      tone === "secondary" ? styles.secondary : styles.primary,
      (disabled || loading) && styles.disabled,
      pressed && !(disabled || loading) ? styles.pressed : null,
      style
    ]}
  >
    {loading ? <ActivityIndicator color={tone === "secondary" ? colors.primary : colors.white} /> : null}
    <Text style={[styles.label, tone === "secondary" ? styles.secondaryLabel : null]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  primary: {
    backgroundColor: colors.primary
  },
  secondary: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border
  },
  disabled: {
    opacity: 0.6
  },
  pressed: {
    transform: [{ scale: 0.99 }]
  },
  label: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryLabel: {
    color: colors.primary
  }
});
