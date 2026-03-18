import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View
} from "react-native";

import { colors } from "../theme/colors";

interface FieldInputProps extends TextInputProps {
  label: string;
}

export const FieldInput = ({ label, style, ...props }: FieldInputProps) => (
  <View style={styles.wrapper}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      placeholderTextColor={colors.mutedText}
      style={[styles.input, style]}
      {...props}
    />
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15
  }
});
