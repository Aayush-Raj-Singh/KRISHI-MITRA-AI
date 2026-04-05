import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { colors, radius, shadows, spacing, typography } from "../theme";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const SectionCard = ({ title, subtitle, children }: SectionCardProps) => {
  const copy = useMobileTranslatedContent({ title, subtitle });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{copy.title}</Text>
        {copy.subtitle ? <Text style={styles.subtitle}>{copy.subtitle}</Text> : null}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.card,
  },
  header: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  content: {
    gap: spacing.md,
    paddingTop: spacing.xs,
  },
});
