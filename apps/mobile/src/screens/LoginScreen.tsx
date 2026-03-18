import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { authApi } from "../services/api";
import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const tokens = await authApi.login({ phone, password });
      setTokens(tokens);
      const profile = await authApi.getCurrentUser();
      setUser(profile);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Welcome back"
      subtitle="Sign in to open your dashboard, crop planning tools, and field advisory assistant."
    >
      <SectionCard title="Account access" subtitle="Use the same backend-authenticated account as the web platform.">
        <FieldInput
          autoCapitalize="none"
          keyboardType="phone-pad"
          label="Phone number"
          onChangeText={setPhone}
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
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton label="Sign in" loading={loading} onPress={handleLogin} />
      </SectionCard>

      <SectionCard title="New here?" subtitle="Create a farmer, officer, or admin account without leaving mobile.">
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Create an account</Text>
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
    padding: 12
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },
  linkText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700"
  }
});
