import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { translateAdvisoryText } from "../services/advisory";

type StringMap = Record<string, string>;

const cacheKey = (language: string) => `krishimitra:translation_cache:${language}`;

const loadCache = (language: string): Record<string, string> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(cacheKey(language));
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
};

const saveCache = (language: string, cache: Record<string, string>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(language), JSON.stringify(cache));
  } catch {
    // ignore cache errors
  }
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
          const translatedText = response.translations[text] || cache[text] || text;
          updated[key] = translatedText;
          nextCache[text] = translatedText;
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
