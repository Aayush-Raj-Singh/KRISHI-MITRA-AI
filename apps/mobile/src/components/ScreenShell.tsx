import React, { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/colors";

interface ScreenShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const ScreenShell = ({ title, subtitle, children }: ScreenShellProps) => (
  <SafeAreaView style={styles.safeArea} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Mobile Field Assistant</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.body}>{children}</View>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32
  },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 28,
    padding: 20,
    gap: 6
  },
  eyebrow: {
    color: "#bfd9c5",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800"
  },
  subtitle: {
    color: "#d7ead9",
    fontSize: 14,
    lineHeight: 20
  },
  body: {
    gap: 16
  }
});
