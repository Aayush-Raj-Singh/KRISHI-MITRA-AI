import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import as from "./locales/as.json";
import bn from "./locales/bn.json";
import en from "./locales/en.json";
import gu from "./locales/gu.json";
import hi from "./locales/hi.json";
import kn from "./locales/kn.json";
import ml from "./locales/ml.json";
import mr from "./locales/mr.json";
import ne from "./locales/ne.json";
import or from "./locales/or.json";
import pa from "./locales/pa.json";
import sa from "./locales/sa.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import ur from "./locales/ur.json";
import { getPreferredLanguage } from "./services/languageStorage";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr },
  gu: { translation: gu },
  kn: { translation: kn },
  pa: { translation: pa },
  as: { translation: as },
  ml: { translation: ml },
  or: { translation: or },
  ur: { translation: ur },
  ne: { translation: ne },
  sa: { translation: sa },
} as const;

let initPromise: Promise<typeof i18n> | null = null;

export const initMobileI18n = async () => {
  if (i18n.isInitialized) {
    return i18n;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const lng = await getPreferredLanguage();
      await i18n.use(initReactI18next).init({
        resources,
        lng,
        fallbackLng: "en",
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
      return i18n;
    })();
  }
  return initPromise;
};

export default i18n;
