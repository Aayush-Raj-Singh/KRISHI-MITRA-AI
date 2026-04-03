import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { translateAdvisoryText } from "../services/advisory";
import { isCorruptedTranslation, repairMojibake } from "./translationSanitizer";

type StringMap = Record<string, string>;

const CACHE_VERSION = "v3";
const cacheKey = (language: string) => `krishimitra:translation_cache:${CACHE_VERSION}:${language}`;

const loadCache = (language: string): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(cacheKey(language));
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const cleaned: Record<string, string> = {};
    Object.entries(parsed).forEach(([key, value]) => {
      const repaired = repairMojibake(value, language);
      if (!isCorruptedTranslation(repaired, language)) {
        cleaned[key] = repaired;
      }
    });
    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      saveCache(language, cleaned);
    }
    return cleaned;
  } catch {
    return {};
  }
};

const saveCache = (language: string, cache: Record<string, string>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(language), JSON.stringify(cache));
  } catch {}
};

export const useTranslatedStrings = (source: StringMap, enabled = true) => {
  const { i18n } = useTranslation();
  const language = i18n.language || "en";
  const [translated, setTranslated] = useState<StringMap>(source);
  const entries = useMemo(() => Object.entries(source), [source]);

  useEffect(() => {
    let isMounted = true;
    if (!enabled || language.startsWith("en")) {
      setTranslated(source);
      return;
    }

    const cache = loadCache(language);
    const interim: StringMap = {};
    const missingTexts: string[] = [];

    entries.forEach(([key, text]) => {
      const cached = cache[text];
      if (cached) {
        interim[key] = cached;
      } else {
        interim[key] = text;
        missingTexts.push(text);
      }
    });

    setTranslated(interim);

    if (!missingTexts.length) {
      return;
    }
    const uniqueMissing = Array.from(new Set(missingTexts));
    translateAdvisoryText({ texts: uniqueMissing, target_language: language })
      .then((response) => {
        if (!isMounted) return;
        const nextCache = { ...cache };
        const updated: StringMap = {};
        entries.forEach(([key, text]) => {
          const rawText = response.translations[text] || cache[text] || text;
          const repaired = repairMojibake(rawText, language);
          if (isCorruptedTranslation(repaired, language)) {
            updated[key] = text;
            return;
          }
          updated[key] = repaired;
          if (!(language !== "en" && repaired.trim() === text.trim())) {
            nextCache[text] = repaired;
          }
        });
        saveCache(language, nextCache);
        setTranslated(updated);
      })
      .catch(() => {
        if (isMounted) {
          setTranslated(source);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [entries, enabled, language, source]);

  return translated;
};
