import React from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { ActionTile } from "../components/ActionTile";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { SectionHeader } from "../components/SectionHeader";
import { serviceCatalog } from "../data/appContent";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { openAppRoute } from "../navigation/routeHelpers";
import { colors, spacing, typography } from "../theme";

export const ServicesScreen = () => {
  const navigation = useNavigation<any>();
  const copy = useMobileTranslatedContent({
    body:
      "Dashboard summaries, advisory chat, disease scanning, market intelligence, farm operations, feedback, notices, portal access, and profile management all use the same backend flows and response contracts as web.",
  });

  return (
    <ScreenShell
      title="Services workspace"
      subtitle="The same service map as web, adapted into touch-first mobile cards and focused task flows."
      eyebrow="Product Workspace"
      heroImageSource={require("../../assets/hero-slide-10.jpg")}
      heroBadges={["Farm Operations", "Market Intelligence", "Disease Detection", "Helpdesk"]}
    >
      <SectionCard
        title="Operational services"
        subtitle="Farm planning, market intelligence, disease workflows, support, and modern farming guides."
      >
        <View style={styles.grid}>
          {serviceCatalog.map((service) => (
            <ActionTile
              key={service.route}
              description={service.description}
              icon={service.icon}
              meta={service.meta}
              onPress={() => openAppRoute(navigation, service.route)}
              title={service.title}
            />
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="How mobile maps to web"
        subtitle="Same features and response flows, reorganized for shorter sessions in the field."
      >
        <SectionHeader
          title="What changed on mobile"
          subtitle="The web navbar becomes bottom tabs plus focused task screens so crop, market, and support actions stay reachable with fewer taps."
        />
        <Text style={styles.copy}>
          {copy.body}
        </Text>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  copy: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
