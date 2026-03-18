import React, { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const SectionCard = ({ title, subtitle, children }: SectionCardProps) => (
  <View style={styles.card}>
    <Text style={styles.title}>{title}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    <View style={styles.content}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 8
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18
  },
  content: {
    gap: 12
  }
});
