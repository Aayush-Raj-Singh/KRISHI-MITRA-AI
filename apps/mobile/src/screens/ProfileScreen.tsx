import React, { useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { authApi } from "../services/api";
import i18n from "../i18n";
import { useAuthStore } from "../store/authStore";
import { ActionTile } from "../components/ActionTile";
import { FieldInput } from "../components/FieldInput";
import { OptionChips } from "../components/OptionChips";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { StatBox } from "../components/StatBox";
import { useMobileTranslatedStrings } from "../hooks/useMobileTranslatedStrings";
import { colors, radius, spacing, typography } from "../theme";
import { openAppRoute } from "../navigation/routeHelpers";
import {
  normalizeAppLanguage,
  setPreferredLanguage,
  SUPPORTED_LANGUAGES,
} from "../services/languageStorage";

export const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const copy = useMobileTranslatedStrings(
    useMemo(
      () => ({
        eyebrow: "Farmer Identity",
        memberSummary: "Member summary",
        memberSummarySubtitle:
          "Identity, field context, and role metadata from your backend profile.",
        editSubtitle: "Update the same account data used across web and mobile.",
        languageHelper: "Choose the language you want to use across the mobile workspace.",
        shortcutTitle: "Profile shortcuts",
        shortcutSubtitle: "Open the same support and portal destinations from your account area.",
        defaultUserName: "KrishiMitra user",
        portalDescription: "Role-based launchpad for services and operations.",
        noticesDescription: "Read current noticeboard items and quick links.",
        feedbackDescription: "Send field outcome feedback and sync queued entries.",
        helpdeskDescription: "Create or respond to support tickets.",
      }),
      [],
    ),
  );

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    location: user?.location || "",
    farm_size: user?.farm_size ? String(user.farm_size) : "",
    soil_type: user?.soil_type || "",
    water_source: user?.water_source || "",
    primary_crops: user?.primary_crops?.join(", ") || "",
    language: user?.language || "en",
    risk_view_consent: Boolean(user?.risk_view_consent),
    notifications: user?.preferences?.notifications ?? true,
    voice_input: user?.preferences?.voice_input ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const initials = useMemo(() => {
    if (!user?.name) {
      return "KM";
    }
    return user.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("");
  }, [user?.name]);

  const handleSave = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const updated = await authApi.updateProfile({
        name: form.name || undefined,
        email: form.email || undefined,
        location: form.location || undefined,
        farm_size: form.farm_size ? Number(form.farm_size) : undefined,
        soil_type: form.soil_type || undefined,
        water_source: form.water_source || undefined,
        primary_crops: form.primary_crops
          ? form.primary_crops
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : undefined,
        language: form.language || undefined,
        risk_view_consent: form.risk_view_consent,
        preferences: {
          notifications: form.notifications,
          voice_input: form.voice_input,
        },
      });
      setUser(updated);
      setNotice(t("profile.saved"));
      const nextLanguage = normalizeAppLanguage(form.language);
      await setPreferredLanguage(nextLanguage);
      await i18n.changeLanguage(nextLanguage);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update the profile right now.");
    } finally {
      setSaving(false);
    }
  };

  const languageOptions = useMemo(
    () =>
      SUPPORTED_LANGUAGES.map((code) => ({
        value: code,
        label: t(`languages.${code}`, { defaultValue: code.toUpperCase() }),
      })),
    [t],
  );

  return (
    <ScreenShell
      title={t("profile.title")}
      subtitle={t("profile.subtitle")}
      eyebrow={copy.eyebrow}
      heroImageSource={require("../../assets/hero-slide-03.png")}
      heroBadges={[
        String(user?.role || t("auth.role_farmer")),
        t("profile.preferences_title"),
        t("auth.location"),
      ]}
    >
      <SectionCard title={copy.memberSummary} subtitle={copy.memberSummarySubtitle}>
        <View style={styles.identityRow}>
          {user?.profile_image_url ? (
            <Image source={{ uri: user.profile_image_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{initials}</Text>
            </View>
          )}
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{user?.name || copy.defaultUserName}</Text>
            <Text style={styles.meta}>{user?.role || "farmer"}</Text>
            <Text style={styles.meta}>{user?.phone || "-"}</Text>
            {user?.email ? <Text style={styles.meta}>{user.email}</Text> : null}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatBox label={t("auth.location")} value={user?.location || "-"} />
          <StatBox
            label={t("auth.farm_size")}
            value={user?.farm_size ? `${user.farm_size}` : "-"}
          />
          <StatBox label={t("languages.title")} value={(user?.language || "en").toUpperCase()} />
        </View>
      </SectionCard>

      <SectionCard title={t("profile.edit_title")} subtitle={copy.editSubtitle}>
        {notice ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{notice}</Text>
          </View>
        ) : null}
        <FieldInput
          label={t("auth.name")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
          value={form.name}
        />
        <FieldInput
          autoCapitalize="none"
          keyboardType="email-address"
          label={t("profile.email")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, email: value }))}
          value={form.email}
        />
        <FieldInput
          label={t("auth.location")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, location: value }))}
          value={form.location}
        />
        <FieldInput
          keyboardType="decimal-pad"
          label={t("auth.farm_size")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, farm_size: value }))}
          value={form.farm_size}
        />
        <FieldInput
          label={t("auth.soil_type")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, soil_type: value }))}
          value={form.soil_type}
        />
        <FieldInput
          label={t("auth.water_source")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, water_source: value }))}
          value={form.water_source}
        />
        <FieldInput
          label={t("auth.primary_crops")}
          onChangeText={(value) => setForm((prev) => ({ ...prev, primary_crops: value }))}
          value={form.primary_crops}
        />
        <Text style={styles.switchLabel}>{copy.languageHelper}</Text>
        <OptionChips
          items={languageOptions}
          limit={SUPPORTED_LANGUAGES.length}
          selected={form.language}
          onSelect={(value) => {
            const nextLanguage = normalizeAppLanguage(value);
            setForm((prev) => ({ ...prev, language: nextLanguage }));
            void setPreferredLanguage(nextLanguage).catch(() => undefined);
            void i18n.changeLanguage(nextLanguage).catch(() => undefined);
          }}
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("profile.notifications")}</Text>
          <Switch
            trackColor={{ false: "#d8ddce", true: "#b2d5b8" }}
            thumbColor={form.notifications ? colors.primary : "#f4f4f4"}
            value={form.notifications}
            onValueChange={(value) => setForm((prev) => ({ ...prev, notifications: value }))}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("profile.voice_input")}</Text>
          <Switch
            trackColor={{ false: "#d8ddce", true: "#b2d5b8" }}
            thumbColor={form.voice_input ? colors.primary : "#f4f4f4"}
            value={form.voice_input}
            onValueChange={(value) => setForm((prev) => ({ ...prev, voice_input: value }))}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>{t("profile.risk_consent")}</Text>
          <Switch
            trackColor={{ false: "#d8ddce", true: "#b2d5b8" }}
            thumbColor={form.risk_view_consent ? colors.primary : "#f4f4f4"}
            value={form.risk_view_consent}
            onValueChange={(value) => setForm((prev) => ({ ...prev, risk_view_consent: value }))}
          />
        </View>

        <Pressable
          onPress={() => void handleSave()}
          style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]}
        >
          <Text style={styles.saveButtonText}>
            {saving ? t("actions.saving") : t("profile.save")}
          </Text>
        </Pressable>
      </SectionCard>

      <SectionCard title={copy.shortcutTitle} subtitle={copy.shortcutSubtitle}>
        <View style={styles.actionGrid}>
          <ActionTile
            description={copy.portalDescription}
            icon="dashboard-customize"
            onPress={() => openAppRoute(navigation, "Portal")}
            title={t("nav.portal")}
          />
          <ActionTile
            description={copy.noticesDescription}
            icon="campaign"
            onPress={() => openAppRoute(navigation, "Notices")}
            title={t("layout.nav_notices")}
          />
          <ActionTile
            description={copy.feedbackDescription}
            icon="rate-review"
            onPress={() => openAppRoute(navigation, "Feedback")}
            title={t("dashboard.feedback")}
          />
          <ActionTile
            description={copy.helpdeskDescription}
            icon="support-agent"
            onPress={() => openAppRoute(navigation, "Helpdesk")}
            title={t("nav.helpdesk")}
          />
        </View>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: colors.primaryDark,
    fontFamily: typography.headingFont,
    fontSize: typography.titleLg,
  },
  identityCopy: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: colors.text,
    fontFamily: typography.headingFont,
    fontSize: typography.titleMd,
  },
  meta: {
    color: colors.mutedText,
    fontSize: typography.body,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  banner: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  switchLabel: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
  },
  saveButton: {
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: "700",
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
});
