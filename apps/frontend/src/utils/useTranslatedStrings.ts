import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { normalizeRuntimeLanguage, translateRuntimeStrings } from "./runtimeTranslation";

type StringMap = Record<string, string>;

export const useTranslatedStrings = (source: StringMap, enabled = true) => {
  const { i18n } = useTranslation();
  const language = normalizeRuntimeLanguage(i18n.language || "en");
  const [translated, setTranslated] = useState<StringMap>(source);
  const entries = useMemo(() => Object.entries(source), [source]);

  useEffect(() => {
    let isMounted = true;
    if (!enabled || language === "en") {
      setTranslated(source);
      return;
    }

    const sourceTexts = entries.map(([, text]) => text);

    translateRuntimeStrings(sourceTexts, language)
      .then((translations) => {
        if (!isMounted) return;
        const updated: StringMap = {};
        entries.forEach(([key, text]) => {
          updated[key] = translations[text] || text;
        });
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
