import { translateAdvisoryText } from "../services/advisory";
import { isCorruptedTranslation, repairMojibake } from "./translationSanitizer";

export type RuntimeStringMap = Record<string, string>;

const CACHE_VERSION = "v4";
const MAX_TRANSLATION_BATCH = 150;

export const normalizeRuntimeLanguage = (language?: string) =>
  String(language || "en")
    .toLowerCase()
    .split("-")[0];

export const runtimeTranslationCacheKey = (language: string) =>
  `krishimitra:translation_cache:${CACHE_VERSION}:${normalizeRuntimeLanguage(language)}`;

export const shouldRuntimeTranslate = (value: string) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 2) {
    return false;
  }
  if (/^[\d\s.,:%₹/+\-()|]+$/.test(cleaned)) {
    return false;
  }
  return /[A-Za-z]/.test(cleaned);
};

export const loadRuntimeTranslationCache = (language: string): RuntimeStringMap => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(runtimeTranslationCacheKey(language));
    const parsed = raw ? (JSON.parse(raw) as RuntimeStringMap) : {};
    const cleaned: RuntimeStringMap = {};

    Object.entries(parsed).forEach(([key, value]) => {
      const repaired = repairMojibake(value, language);
      if (!isCorruptedTranslation(repaired, language)) {
        cleaned[key] = repaired;
      }
    });

    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      saveRuntimeTranslationCache(language, cleaned);
    }

    return cleaned;
  } catch {
    return {};
  }
};

export const saveRuntimeTranslationCache = (language: string, cache: RuntimeStringMap) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(runtimeTranslationCacheKey(language), JSON.stringify(cache));
  } catch {}
};

export const translateRuntimeStrings = async (
  texts: string[],
  language: string,
): Promise<RuntimeStringMap> => {
  const normalizedLanguage = normalizeRuntimeLanguage(language);
  const uniqueTexts = Array.from(new Set(texts.filter(shouldRuntimeTranslate)));

  if (normalizedLanguage === "en" || uniqueTexts.length === 0) {
    return Object.fromEntries(uniqueTexts.map((text) => [text, text]));
  }

  const cache = loadRuntimeTranslationCache(normalizedLanguage);
  const result: RuntimeStringMap = {};
  const missing = uniqueTexts.filter((text) => !cache[text]);

  uniqueTexts.forEach((text) => {
    result[text] = cache[text] || text;
  });

  if (missing.length === 0) {
    return result;
  }

  const nextCache = { ...cache };

  for (let index = 0; index < missing.length; index += MAX_TRANSLATION_BATCH) {
    const chunk = missing.slice(index, index + MAX_TRANSLATION_BATCH);
    const response = await translateAdvisoryText({
      texts: chunk,
      target_language: normalizedLanguage,
      source_language: "auto",
    });

    chunk.forEach((text) => {
      const rawValue = response.translations[text] || text;
      const repaired = repairMojibake(rawValue, normalizedLanguage);
      const finalValue = isCorruptedTranslation(repaired, normalizedLanguage) ? text : repaired;

      result[text] = finalValue;
      if (!(normalizedLanguage !== "en" && finalValue.trim() === text.trim())) {
        nextCache[text] = finalValue;
      }
    });
  }

  saveRuntimeTranslationCache(normalizedLanguage, nextCache);
  return result;
};
