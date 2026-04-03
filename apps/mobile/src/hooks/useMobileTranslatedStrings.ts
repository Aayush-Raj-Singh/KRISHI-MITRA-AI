import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { advisoryApi } from "../services/api";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";
import { normalizeAppLanguage } from "../services/languageStorage";

type StringMap = Record<string, string>;

const CACHE_SCOPE = "mobile_translation_cache_v1";

export const useMobileTranslatedStrings = (source: StringMap, enabled = true) => {
  const { i18n } = useTranslation();
  const language = normalizeAppLanguage(i18n.language);
  const [translated, setTranslated] = useState<StringMap>(source);
  const entries = useMemo(() => Object.entries(source), [source]);

  useEffect(() => {
    let active = true;

    if (!enabled || language === "en") {
      setTranslated(source);
      return () => {
        active = false;
      };
    }

    const cacheKey = buildCacheKey(`${CACHE_SCOPE}:${language}`);

    void (async () => {
      const cacheRecord = await readCacheRecord<Record<string, string>>(cacheKey);
      const cache = cacheRecord?.value || {};
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

      if (!active) {
        return;
      }

      setTranslated(interim);

      if (!missingTexts.length) {
        return;
      }

      try {
        const response = await advisoryApi.translate({
          texts: Array.from(new Set(missingTexts)),
          target_language: language,
        });
        const nextCache = { ...cache };
        const nextValues: StringMap = {};

        entries.forEach(([key, text]) => {
          const translatedText = response.translations[text] || cache[text] || text;
          nextValues[key] = translatedText;
          if (translatedText.trim() !== text.trim()) {
            nextCache[text] = translatedText;
          }
        });

        await writeCacheRecord(cacheKey, nextCache);

        if (active) {
          setTranslated(nextValues);
        }
      } catch {
        if (active) {
          setTranslated(source);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [enabled, entries, language, source]);

  return translated;
};
