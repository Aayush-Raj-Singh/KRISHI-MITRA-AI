import AsyncStorage from "@react-native-async-storage/async-storage";

export const SUPPORTED_LANGUAGES = [
  "en",
  "hi",
  "bn",
  "ta",
  "te",
  "mr",
  "gu",
  "kn",
  "pa",
  "as",
  "ml",
  "or",
  "ur",
  "ne",
  "sa",
] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const LANGUAGE_STORAGE_KEY = "krishimitra:mobile:language";

export const normalizeAppLanguage = (value?: string | null): AppLanguage => {
  const normalized = String(value || "en")
    .trim()
    .toLowerCase()
    .split("-")[0] as AppLanguage;
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : "en";
};

export const getPreferredLanguage = async (): Promise<AppLanguage> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return normalizeAppLanguage(stored);
  } catch {
    return "en";
  }
};

export const setPreferredLanguage = async (value: string): Promise<AppLanguage> => {
  const normalized = normalizeAppLanguage(value);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  } catch {}
  return normalized;
};
