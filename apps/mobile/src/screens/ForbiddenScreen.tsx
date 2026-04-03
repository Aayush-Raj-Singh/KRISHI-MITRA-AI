import React from "react";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { openAppRoute } from "../navigation/routeHelpers";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";

interface ForbiddenScreenProps {
  title?: string;
  description?: string;
}

export const ForbiddenScreen = ({
  title = "Access restricted",
  description = "Your account does not have permission to view this mobile workspace.",
}: ForbiddenScreenProps) => {
  const navigation = useNavigation<any>();
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <ScreenShell
      title={title}
      subtitle={description}
      eyebrow="Restricted"
      heroImageSource={require("../../assets/hero-slide-04.png")}
      heroBadges={["Restricted Access", "Role Guard", "Protected Workspace"]}
    >
      <SectionCard
        title="Permission required"
        subtitle="This matches the restricted-access state exposed by the web application."
      >
        <View style={styles.iconShell}>
          <MaterialIcons color={colors.accent} name="block" size={32} />
        </View>
        <Text style={styles.copy}>
          If you believe you should have access to this area, contact an administrator or sign in
          with the correct role.
        </Text>
        <PrimaryButton
          label={accessToken ? "Go to dashboard" : "Go to sign in"}
          onPress={() => {
            if (accessToken) {
              openAppRoute(navigation, "Dashboard");
              return;
            }
            navigation.navigate("Login");
          }}
        />
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    color: colors.mutedText,
    fontSize: typography.body,
    lineHeight: 22,
  },
});
