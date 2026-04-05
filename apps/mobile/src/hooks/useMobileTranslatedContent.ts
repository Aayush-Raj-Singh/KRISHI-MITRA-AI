import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { advisoryApi } from "../services/api";
import { normalizeAppLanguage } from "../services/languageStorage";
import { buildCacheKey, readCacheRecord, writeCacheRecord } from "../services/storage";

type Options = {
  enabled?: boolean;
  ignoreKeys?: string[];
};

const CACHE_SCOPE = "mobile_translation_content_v1";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const shouldTranslate = (value: string) => {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 2) {
    return false;
  }
  if (/^[\d\s.,:%₹/+\-()|]+$/.test(cleaned)) {
    return false;
  }
  return /[A-Za-z]/.test(cleaned);
};

const collectStrings = (
  value: unknown,
  ignoreKeys: Set<string>,
  bucket: string[] = [],
): string[] => {
  if (typeof value === "string") {
    if (shouldTranslate(value)) {
      bucket.push(value);
    }
    return bucket;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, ignoreKeys, bucket));
    return bucket;
  }

  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) => {
      if (ignoreKeys.has(key)) {
        return;
      }
      collectStrings(item, ignoreKeys, bucket);
    });
  }

  return bucket;
};

const applyTranslations = <T>(
  value: T,
  translations: Record<string, string>,
  ignoreKeys: Set<string>,
): T => {
  if (typeof value === "string") {
    return (translations[value] || value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => applyTranslations(item, translations, ignoreKeys)) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (ignoreKeys.has(key)) {
          return [key, item];
        }
        return [key, applyTranslations(item, translations, ignoreKeys)];
      }),
    ) as T;
  }

  return value;
};

export const useMobileTranslatedContent = <T,>(source: T, options?: Options): T => {
  const { i18n } = useTranslation();
  const language = normalizeAppLanguage(i18n.language);
  const enabled = options?.enabled ?? true;
  const ignoreKeys = useMemo(
    () =>
      new Set([
        "id",
        "route",
        "icon",
        "key",
        "value",
        "params",
        "url",
        "logoSource",
        ...(options?.ignoreKeys || []),
      ]),
    [options?.ignoreKeys],
  );
  const [translated, setTranslated] = useState<T>(source);
  const strings = useMemo(
    () => Array.from(new Set(collectStrings(source, ignoreKeys))),
    [ignoreKeys, source],
  );

  useEffect(() => {
    let active = true;

    if (!enabled || language === "en" || strings.length === 0) {
      setTranslated(source);
      return () => {
        active = false;
      };
    }

    const cacheKey = buildCacheKey(`${CACHE_SCOPE}:${language}`);

    void (async () => {
      const cacheRecord = await readCacheRecord<Record<string, string>>(cacheKey);
      const cache = cacheRecord?.value || {};
      const missing = strings.filter((item) => !cache[item]);
      const nextCache = { ...cache };

      if (missing.length > 0) {
        try {
          const response = await advisoryApi.translate({
            texts: missing,
            target_language: language,
          });

          missing.forEach((item) => {
            const translatedValue = response.translations[item] || item;
            if (translatedValue.trim() !== item.trim()) {
              nextCache[item] = translatedValue;
            }
          });

          await writeCacheRecord(cacheKey, nextCache);
        } catch {
          if (active) {
            setTranslated(source);
          }
          return;
        }
      }

      if (!active) {
        return;
      }

      setTranslated(applyTranslations(source, nextCache, ignoreKeys));
    })();

    return () => {
      active = false;
    };
  }, [enabled, ignoreKeys, language, source, strings]);

  return translated;
};
