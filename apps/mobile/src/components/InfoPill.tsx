import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { colors, radius, spacing, typography } from "../theme";

interface InfoPillProps {
  label: string;
  tone?: "default" | "success" | "accent";
}

export const InfoPill = ({ label, tone = "default" }: InfoPillProps) => {
  const copy = useMobileTranslatedContent({ label });

  return (
    <View
      style={[
        styles.base,
        tone === "success" ? styles.success : null,
        tone === "accent" ? styles.accent : null,
      ]}
    >
      <Text style={[styles.text, tone === "accent" ? styles.accentText : null]}>
        {copy.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
  },
  success: {
    backgroundColor: colors.primarySoft,
    borderColor: "#c5d8c6",
  },
  accent: {
    backgroundColor: colors.accentSoft,
    borderColor: "#e3c393",
  },
  text: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  accentText: {
    color: colors.accent,
  },
});
