import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

export interface InlineTabItem {
  key: string;
  label: string;
}

interface InlineTabsProps {
  activeKey: string;
  items: InlineTabItem[];
  onChange: (key: string) => void;
}

export const InlineTabs = ({ activeKey, items, onChange }: InlineTabsProps) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {items.map((item) => {
      const active = item.key === activeKey;
      return (
        <Pressable
          key={item.key}
          onPress={() => onChange(item.key)}
          style={[styles.tab, active ? styles.activeTab : null]}
        >
          <Text style={[styles.label, active ? styles.activeLabel : null]}>{item.label}</Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  tab: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  activeLabel: {
    color: colors.white,
  },
});
