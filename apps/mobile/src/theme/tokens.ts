import { Platform } from "react-native";

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

export const typography = {
  bodyFont: Platform.select({ ios: "System", android: "sans-serif", default: "System" }),
  headingFont: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }),
  eyebrow: 12,
  caption: 13,
  body: 15,
  bodyLg: 16,
  titleSm: 18,
  titleMd: 22,
  titleLg: 30,
  display: 34,
} as const;

export const shadows = {
  card: {
    shadowColor: "#0d321c",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  hero: {
    shadowColor: "#0d321c",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
} as const;
