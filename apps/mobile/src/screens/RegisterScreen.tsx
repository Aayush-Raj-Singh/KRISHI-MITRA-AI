import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { authApi } from "../services/api";
import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";

const roles = [
  { id: "farmer", label: "Farmer" },
  { id: "extension_officer", label: "Extension Officer" },
  { id: "admin", label: "Admin" }
] as const;

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    location: "",
    farmSize: "2.5",
    soilType: "Loamy",
    waterSource: "Canal",
    primaryCrops: "Rice, Wheat",
    language: "en",
    role: "farmer" as (typeof roles)[number]["id"]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedRegions = useMemo(
    () => (form.role === "farmer" ? [] : form.location.split(",").map((item) => item.trim()).filter(Boolean)),
    [form.location, form.role]
  );

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await authApi.register({
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        location: form.location,
        farm_size: Number(form.farmSize),
        soil_type: form.soilType,
        water_source: form.waterSource,
        primary_crops: form.primaryCrops.split(",").map((item) => item.trim()).filter(Boolean),
        role: form.role,
        language: form.language,
        assigned_regions: assignedRegions,
        risk_view_consent: form.role !== "farmer"
      });
      if (response.token) {
        setTokens(response.token);
      }
      setUser(response.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create account right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell
      title="Create mobile access"
      subtitle="Register once and keep the same backend account across web and mobile."
    >
      <SectionCard title="Identity" subtitle="Start with your core profile and role.">
        <FieldInput label="Full name" onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))} value={form.name} />
        <FieldInput
          keyboardType="phone-pad"
          label="Phone number"
          onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
          value={form.phone}
        />
        <FieldInput
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
          value={form.email}
        />
        <FieldInput
          autoCapitalize="none"
          label="Password"
          onChangeText={(value) => setForm((prev) => ({ ...prev, password: value }))}
          secureTextEntry
          value={form.password}
        />
        <View style={styles.roleRow}>
          {roles.map((role) => (
            <Pressable
              key={role.id}
              onPress={() => setForm((prev) => ({ ...prev, role: role.id }))}
              style={[styles.roleChip, form.role === role.id ? styles.roleChipActive : null]}
            >
              <Text style={[styles.roleLabel, form.role === role.id ? styles.roleLabelActive : null]}>
                {role.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Farm context" subtitle="These fields feed directly into the existing business workflows.">
        <FieldInput label="Location" onChangeText={(value) => setForm((prev) => ({ ...prev, location: value }))} value={form.location} />
        <FieldInput
          keyboardType="decimal-pad"
          label="Farm size (acres)"
          onChangeText={(value) => setForm((prev) => ({ ...prev, farmSize: value }))}
          value={form.farmSize}
        />
        <FieldInput label="Soil type" onChangeText={(value) => setForm((prev) => ({ ...prev, soilType: value }))} value={form.soilType} />
        <FieldInput
          label="Water source"
          onChangeText={(value) => setForm((prev) => ({ ...prev, waterSource: value }))}
          value={form.waterSource}
        />
        <FieldInput
          label="Primary crops"
          onChangeText={(value) => setForm((prev) => ({ ...prev, primaryCrops: value }))}
          placeholder="Rice, Wheat"
          value={form.primaryCrops}
        />
        <FieldInput
          autoCapitalize="none"
          label="Language code"
          onChangeText={(value) => setForm((prev) => ({ ...prev, language: value }))}
          value={form.language}
        />

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PrimaryButton label="Create account" loading={loading} onPress={handleRegister} />
      </SectionCard>

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Back to sign in</Text>
      </Pressable>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  roleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  roleChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#dcebdc"
  },
  roleLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  roleLabelActive: {
    color: colors.primary
  },
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
