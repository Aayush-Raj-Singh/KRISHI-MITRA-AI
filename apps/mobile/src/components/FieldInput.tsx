import React from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

import { colors, radius, spacing, typography } from "../theme";

interface FieldInputProps extends TextInputProps {
  label: string;
  helperText?: string;
}

export const FieldInput = ({ label, helperText, style, ...props }: FieldInputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor={colors.mutedText} style={[styles.input, style]} {...props} />
    {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700",
  },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: typography.body,
  },
  helper: {
    color: colors.mutedText,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
