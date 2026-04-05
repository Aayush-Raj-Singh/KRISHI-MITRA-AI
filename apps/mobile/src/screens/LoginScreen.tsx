import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AuthShowcaseCard } from "../components/AuthShowcaseCard";
import { authApi } from "../services/api";
import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { loginShowcasePoints } from "../data/appContent";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { useAuthStore } from "../store/authStore";
import { colors, typography } from "../theme";

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedPhone = phone.replace(/\D/g, "").slice(0, 10);
  const canSubmit = normalizedPhone.length === 10 && password.length >= 8 && !loading;
  const copy = useMobileTranslatedContent({
    phoneDigits: "Phone number must be 10 digits.",
    passwordMin: "Password must be at least 8 characters.",
    fallbackError: "Unable to sign in right now.",
    helper:
      "Enter a 10-digit phone number and a password with at least 8 characters.",
    resetPassword: "Reset password",
    createAccount: "Create an account",
  });
  const translatedError = useMobileTranslatedContent({ error: error || "" }).error;

  const handleLogin = async () => {
    setError(null);
    if (normalizedPhone.length !== 10) {
      setError(copy.phoneDigits);
      return;
    }
    if (password.length < 8) {
      setError(copy.passwordMin);
      return;
    }
    setLoading(true);

    try {
      const tokens = await authApi.login({ phone: normalizedPhone, password });
      setTokens(tokens);
      const profile = await authApi.getCurrentUser();
      setUser(profile);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : copy.fallbackError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Welcome back"
      subtitle="Sign in to open the same dashboard, services workspace, and advisory tools available on the web portal."
      eyebrow="Secure Access"
      heroImageSource={require("../../assets/hero-slide-06.jpg")}
      heroBadges={["Dashboard", "Services", "Advisory", "Portal Access"]}
    >
      <AuthShowcaseCard
        points={loginShowcasePoints}
        subtitle="Government-style portal access, rebuilt for touch-first field use."
        title="Digital agriculture workspace"
      />

      <SectionCard
        title="Account access"
        subtitle="Use the same backend-authenticated account as the web platform."
      >
        <FieldInput
          autoCapitalize="none"
          keyboardType="phone-pad"
          label="Phone number"
          onChangeText={(value) => setPhone(value.replace(/\D/g, "").slice(0, 10))}
          placeholder="9876543210"
          value={phone}
        />
        <FieldInput
          autoCapitalize="none"
          label="Password"
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          value={password}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{translatedError}</Text>
          </View>
        ) : null}

        {!error && !canSubmit ? (
          <View style={styles.helperBanner}>
            <Text style={styles.helperText}>{copy.helper}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Sign in"
          loading={loading}
          onPress={handleLogin}
          disabled={!canSubmit}
        />
        <Pressable onPress={() => navigation.navigate("ResetPassword")}>
          <Text style={styles.linkText}>{copy.resetPassword}</Text>
        </Pressable>
      </SectionCard>

      <SectionCard
        title="New here?"
        subtitle="Create a farmer, officer, or admin account without leaving mobile."
      >
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>{copy.createAccount}</Text>
        </Pressable>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: "#fde9e2",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#edc2b4",
    padding: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18,
  },
  helperBanner: {
    backgroundColor: "#eef4ed",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d8e8d5",
    padding: 12,
  },
  helperText: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
