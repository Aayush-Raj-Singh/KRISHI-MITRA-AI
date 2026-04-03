import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

interface OptionChipsProps {
  items: Array<string | { label: string; value: string }>;
  selected?: string;
  onSelect: (value: string) => void;
  limit?: number;
}

export const OptionChips = ({ items, selected, onSelect, limit = 8 }: OptionChipsProps) => {
  const visibleItems = items.filter(Boolean).slice(0, limit);
  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {visibleItems.map((item) => {
        const value = typeof item === "string" ? item : item.value;
        const label = typeof item === "string" ? item : item.label;
        const active = value.trim().toLowerCase() === (selected || "").trim().toLowerCase();
        return (
          <Pressable
            key={value}
            accessibilityRole="button"
            onPress={() => onSelect(value)}
            style={({ pressed }) => [
              styles.chip,
              active ? styles.chipActive : null,
              pressed ? styles.chipPressed : null,
            ]}
          >
            <Text style={[styles.label, active ? styles.labelActive : null]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipPressed: {
    opacity: 0.88,
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.primaryDark,
  },
});
