import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AuthShowcaseCard } from "../components/AuthShowcaseCard";
import { FieldInput } from "../components/FieldInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { useMobileTranslatedContent } from "../hooks/useMobileTranslatedContent";
import { authApi } from "../services/api";
import { colors, spacing, typography } from "../theme";

const resetPoints = [
  {
    icon: "shield" as const,
    text: "Secure account recovery workflow for shared web and mobile accounts.",
  },
  { icon: "mark-email-read" as const, text: "OTP verification through SMS or email." },
  {
    icon: "water-drop" as const,
    text: "Restore access to crop planning, irrigation, and advisory tools quickly.",
  },
];

export const ResetPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const copy = useMobileTranslatedContent({
    codeSent: "Recovery code sent. Check your selected channel and continue below.",
    requestError: "Unable to send a recovery code right now.",
    passwordUpdated: "Password updated. You can now return to sign in.",
    updateError: "Unable to update the password right now.",
    backToSignIn: "Back to sign in",
  });
  const translatedNotice = useMobileTranslatedContent({ notice: notice || "" }).notice;

  const requestCode = async () => {
    setLoadingRequest(true);
    setNotice(null);
    try {
      await authApi.requestPasswordReset({ phone, channel });
      setNotice(copy.codeSent);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.requestError);
    } finally {
      setLoadingRequest(false);
    }
  };

  const confirmReset = async () => {
    setLoadingConfirm(true);
    setNotice(null);
    try {
      await authApi.confirmPasswordReset({ phone, otp, new_password: newPassword });
      setNotice(copy.passwordUpdated);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : copy.updateError);
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <ScreenShell
      title="Reset password"
      subtitle="Account recovery uses the same OTP reset flow as web, organized for mobile completion."
      eyebrow="Secure Recovery"
      heroImageSource={require("../../assets/hero-slide-04.png")}
      heroBadges={["OTP Recovery", "SMS or Email", "Secure Reset"]}
    >
      <AuthShowcaseCard
        points={resetPoints}
        subtitle="Recover access without leaving the mobile app."
        title="Farmer account recovery"
      />

      <SectionCard
        title="Request code"
        subtitle="Choose SMS or email and send a reset code to your account."
      >
        <FieldInput
          keyboardType="phone-pad"
          label="Phone number"
          onChangeText={setPhone}
          value={phone}
        />
        <FieldInput
          autoCapitalize="none"
          helperText="Type sms or email."
          label="Channel"
          onChangeText={(value) =>
            setChannel(value.trim().toLowerCase() === "email" ? "email" : "sms")
          }
          value={channel}
        />
        {notice ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{translatedNotice}</Text>
          </View>
        ) : null}
        <PrimaryButton
          label="Send reset code"
          loading={loadingRequest}
          onPress={() => void requestCode()}
          disabled={!phone}
        />
      </SectionCard>

      <SectionCard title="Confirm reset" subtitle="Enter the OTP and choose a new password.">
        <FieldInput label="OTP code" onChangeText={setOtp} value={otp} />
        <FieldInput
          label="New password"
          onChangeText={setNewPassword}
          secureTextEntry
          value={newPassword}
        />
        <PrimaryButton
          label="Update password"
          loading={loadingConfirm}
          onPress={() => void confirmReset()}
          disabled={!phone || !otp || !newPassword}
        />
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>{copy.backToSignIn}</Text>
        </Pressable>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  link: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },
});
