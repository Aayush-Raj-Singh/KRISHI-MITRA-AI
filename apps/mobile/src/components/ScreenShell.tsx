import React, { ReactNode } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { AppChrome } from "./AppChrome";
import { AppFooter } from "./AppFooter";
import { colors, radius, shadows, spacing, typography } from "../theme";

interface ScreenShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  heroBadges?: string[];
  heroImageSource?: ImageSourcePropType;
  children: ReactNode;
}

export const ScreenShell = ({
  title,
  subtitle,
  eyebrow = "KrishiMitra AI",
  heroBadges,
  heroImageSource,
  children,
}: ScreenShellProps) => {
  const copy = useMobileTranslatedContent({ title, subtitle, eyebrow, heroBadges });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppChrome />
        {heroImageSource ? (
          <ImageBackground imageStyle={styles.heroImage} source={heroImageSource} style={styles.hero}>
            <View style={styles.heroOverlay}>
              <View style={styles.heroGlow} />
              <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
              {copy.heroBadges?.length ? (
                <View style={styles.badgesRow}>
                  {copy.heroBadges.map((badge) => (
                    <View key={badge} style={styles.badge}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.hero}>
            <View style={styles.heroGlow} />
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
            {copy.heroBadges?.length ? (
              <View style={styles.badgesRow}>
                {copy.heroBadges.map((badge) => (
                  <View key={badge} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
        <View style={styles.body}>{children}</View>
        <AppFooter />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    minHeight: 192,
    ...shadows.hero,
  },
  heroImage: {
    borderRadius: radius.xl,
  },
  heroOverlay: {
    minHeight: 192,
    backgroundColor: "rgba(16, 66, 35, 0.6)",
    padding: spacing.lg,
    gap: spacing.xs,
  },
  heroGlow: {
    position: "absolute",
    right: -24,
    top: -18,
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  eyebrow: {
    color: "#bfd9c5",
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: colors.white,
    fontFamily: typography.headingFont,
    fontSize: typography.display,
    lineHeight: 40,
  },
  subtitle: {
    color: "#d7ead9",
    fontSize: typography.body,
    lineHeight: 22,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  badge: {
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  badgeText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: "700",
  },
  body: {
    gap: spacing.md,
  },
});
