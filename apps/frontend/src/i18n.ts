import i18n, { type PostProcessorModule } from "i18next";
import { initReactI18next } from "react-i18next";

import { repairMojibake } from "./utils/translationSanitizer";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import ta from "./locales/ta.json";
import te from "./locales/te.json";
import mr from "./locales/mr.json";
import bn from "./locales/bn.json";
import gu from "./locales/gu.json";
import kn from "./locales/kn.json";
import pa from "./locales/pa.json";
import assamese from "./locales/as.json";
import ml from "./locales/ml.json";
import or from "./locales/or.json";
import ur from "./locales/ur.json";
import ne from "./locales/ne.json";
import sa from "./locales/sa.json";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ta: { translation: ta },
  te: { translation: te },
  mr: { translation: mr },
  bn: { translation: bn },
  gu: { translation: gu },
  kn: { translation: kn },
  pa: { translation: pa },
  as: { translation: assamese },
  ml: { translation: ml },
  or: { translation: or },
  ur: { translation: ur },
  ne: { translation: ne },
  sa: { translation: sa }
};

const supportedLanguages = Object.keys(resources);
const storedLangRaw = (localStorage.getItem("language") || "en").toLowerCase();
const storedLang = supportedLanguages.includes(storedLangRaw) ? storedLangRaw : "en";

const syncDocumentLanguage = (language: string) => {
  if (typeof document === "undefined") return;
  const short = String(language || "en").toLowerCase().split("-")[0];
  document.documentElement.lang = short;
  document.documentElement.setAttribute("data-language", short);
};

const sanitizeMojibake: PostProcessorModule = {
  name: "sanitizeMojibake",
  type: "postProcessor",
  process: (value: string, _key: string, options: Record<string, unknown>, translator: typeof i18n) => {
    const lang = String(options?.lng || translator.language || "en");
    return repairMojibake(value, lang);
  }
};

i18n.use(sanitizeMojibake).use(initReactI18next).init({
  resources,
  lng: storedLang,
  fallbackLng: "en",
  postProcess: ["sanitizeMojibake"],
  returnNull: false,
  interpolation: {
    escapeValue: false
  }
});

syncDocumentLanguage(storedLang);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
