import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { ActionTile } from "../components/ActionTile";
import { AuthShowcaseCard } from "../components/AuthShowcaseCard";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { loginShowcasePoints, serviceCatalog } from "../data/appContent";
import { openAppRoute } from "../navigation/routeHelpers";
import { colors, spacing, typography } from "../theme";

export const LandingScreen = () => {
  const navigation = useNavigation<any>();
  const featureTiles = serviceCatalog.slice(0, 6);

  return (
    <ScreenShell
      title="KrishiMitra AI"
      subtitle="A unified agriculture platform for advisory, market intelligence, irrigation planning, disease detection, and field support."
      eyebrow="Platform Overview"
      heroImageSource={require("../../assets/hero-slide-06.jpg")}
      heroBadges={["AI Crop Advisory", "Market Intelligence", "Water Optimization"]}
    >
      <AuthShowcaseCard
        points={loginShowcasePoints}
        subtitle="The same product story as web, adapted into a mobile-first entry experience."
        title="Digital agriculture workspace"
      />

      <SectionCard
        title="Get started"
        subtitle="Choose sign in or registration, then continue into the same backend-connected workspace as the web app."
      >
        <PrimaryButton label="Sign in" onPress={() => navigation.navigate("Login")} />
        <PrimaryButton
          label="Create account"
          onPress={() => navigation.navigate("Register")}
          tone="secondary"
        />
      </SectionCard>

      <SectionCard
        title="Platform features"
        subtitle="The mobile app now mirrors the same major workspaces exposed on the web landing page."
      >
        <View style={styles.grid}>
          {featureTiles.map((feature) => (
            <ActionTile
              key={feature.route}
              description={feature.description}
              icon={feature.icon}
              meta={feature.meta}
              onPress={() => openAppRoute(navigation, feature.route)}
              title={feature.title}
            />
          ))}
        </View>
      </SectionCard>

      <Text style={styles.footerCopy}>
        Sign in to open dashboard, portal, market intelligence, advisory, and role-based operational
        workflows.
      </Text>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  footerCopy: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: "center",
  },
});
