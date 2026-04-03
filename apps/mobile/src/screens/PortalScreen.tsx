import React, { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore } from "../store/authStore";
import { ActionTile } from "../components/ActionTile";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { portalModulesByRole } from "../data/appContent";
import { useMobileTranslatedStrings } from "../hooks/useMobileTranslatedStrings";
import { openAppRoute } from "../navigation/routeHelpers";
import { spacing } from "../theme";

export const PortalScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const role = useAuthStore((state) => state.user?.role || "farmer");
  const modules = portalModulesByRole[role];
  const copy = useMobileTranslatedStrings(
    useMemo(
      () => ({
        subtitle:
          "Role-based launchpad for the same operational modules available from the web portal.",
        eyebrow: "Role Workspace",
        badgeModules: "Role Modules",
        badgeLaunchpad: "Operational Launchpad",
        badgeProductMap: "Same Product Map",
        sectionTitle: "Launch modules",
        sectionSubtitle:
          "Cards are filtered by your role, but they stay on the same product map as web.",
        tileDescription: "Open the corresponding mobile workspace.",
      }),
      [],
    ),
  );
  const moduleTitleMap = useMobileTranslatedStrings(
    useMemo(
      () => Object.fromEntries(modules.map((module, index) => [`module_${index}`, module.title])),
      [modules],
    ),
  );

  return (
    <ScreenShell
      title={t("nav.portal")}
      subtitle={copy.subtitle}
      eyebrow={copy.eyebrow}
      heroImageSource={require("../../assets/hero-slide-03.png")}
      heroBadges={[copy.badgeModules, copy.badgeLaunchpad, copy.badgeProductMap]}
    >
      <SectionCard title={copy.sectionTitle} subtitle={copy.sectionSubtitle}>
        <View style={styles.grid}>
          {modules.map((module, index) => (
            <ActionTile
              key={module.title}
              description={copy.tileDescription}
              icon={module.icon as any}
              onPress={() => openAppRoute(navigation, module.route, module.params)}
              title={moduleTitleMap[`module_${index}`] || module.title}
            />
          ))}
        </View>
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
});
