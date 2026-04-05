import React from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EXTERNAL_PORTALS } from "../data/layoutPortalData";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { colors, radius, shadows, spacing, typography } from "../theme";

export const AppFooter = () => {
  const copy = useMobileTranslatedContent({
    eyebrow: "External Links",
    title: "Connected public-service network",
    pill: "Verified links",
  });

  const handleExternal = (url: string) => {
    void Linking.openURL(url).catch(() => undefined);
  };

  return (
    <View style={styles.footerCard}>
      <View style={styles.headerRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
        </View>
        <View style={styles.livePill}>
          <Text style={styles.livePillText}>{copy.pill}</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.logoRow}
      >
        {EXTERNAL_PORTALS.map((portal) => (
          <Pressable
            key={portal.name}
            accessibilityRole="button"
            onPress={() => handleExternal(portal.url)}
            style={({ pressed }) => [styles.logoCard, pressed ? styles.logoCardPressed : null]}
          >
            <Image source={portal.logoSource} resizeMode="contain" style={styles.logoImage} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  footerCard: {
    gap: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    ...shadows.card,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.text,
    fontFamily: typography.headingFont,
    fontSize: typography.titleSm,
  },
  livePill: {
    borderRadius: radius.pill,
    backgroundColor: colors.successSoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  livePillText: {
    color: colors.primaryDark,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  logoRow: {
    gap: spacing.sm,
  },
  logoCard: {
    width: 148,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  logoCardPressed: {
    opacity: 0.9,
  },
  logoImage: {
    width: "100%",
    height: 38,
  },
});
