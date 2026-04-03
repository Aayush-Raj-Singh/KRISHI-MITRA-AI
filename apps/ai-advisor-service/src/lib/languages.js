const LANGUAGE_MAP = {
  en: { code: "en", label: "English", translateSupported: true },
  english: { code: "en", label: "English", translateSupported: true },
  hi: { code: "hi", label: "Hindi", translateSupported: true },
  hindi: { code: "hi", label: "Hindi", translateSupported: true },
  bn: { code: "bn", label: "Bengali", translateSupported: true },
  bengali: { code: "bn", label: "Bengali", translateSupported: true },
  ta: { code: "ta", label: "Tamil", translateSupported: true },
  tamil: { code: "ta", label: "Tamil", translateSupported: true },
  te: { code: "te", label: "Telugu", translateSupported: true },
  telugu: { code: "te", label: "Telugu", translateSupported: true },
  mr: { code: "mr", label: "Marathi", translateSupported: true },
  marathi: { code: "mr", label: "Marathi", translateSupported: true },
  gu: { code: "gu", label: "Gujarati", translateSupported: true },
  gujarati: { code: "gu", label: "Gujarati", translateSupported: true },
  kn: { code: "kn", label: "Kannada", translateSupported: true },
  kannada: { code: "kn", label: "Kannada", translateSupported: true },
  pa: { code: "pa", label: "Punjabi", translateSupported: true },
  punjabi: { code: "pa", label: "Punjabi", translateSupported: true },
  as: { code: "as", label: "Assamese", translateSupported: false },
  assamese: { code: "as", label: "Assamese", translateSupported: false },
  ml: { code: "ml", label: "Malayalam", translateSupported: true },
  malayalam: { code: "ml", label: "Malayalam", translateSupported: true },
  or: { code: "or", label: "Odia", translateSupported: false },
  odia: { code: "or", label: "Odia", translateSupported: false },
  oriya: { code: "or", label: "Odia", translateSupported: false },
  ur: { code: "ur", label: "Urdu", translateSupported: true },
  urdu: { code: "ur", label: "Urdu", translateSupported: true },
  ne: { code: "ne", label: "Nepali", translateSupported: false },
  nepali: { code: "ne", label: "Nepali", translateSupported: false },
  sa: { code: "sa", label: "Sanskrit", translateSupported: false },
  sanskrit: { code: "sa", label: "Sanskrit", translateSupported: false },
};

const normalize = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const pickFromAcceptLanguage = (headerValue) => {
  const candidates = String(headerValue || "")
    .split(",")
    .map((item) => item.trim().split(";")[0]?.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    const base = candidate.toLowerCase().split("-")[0];
    if (LANGUAGE_MAP[base]) {
      return LANGUAGE_MAP[base];
    }
  }

  return null;
};

export const resolveLanguage = ({
  bodyLanguage,
  headerLanguage,
  acceptLanguage,
  fallback = "en",
} = {}) => {
  const explicit = LANGUAGE_MAP[normalize(bodyLanguage)] || LANGUAGE_MAP[normalize(headerLanguage)];
  if (explicit) {
    return explicit;
  }

  const accepted = pickFromAcceptLanguage(acceptLanguage);
  if (accepted) {
    return accepted;
  }

  return LANGUAGE_MAP[normalize(fallback)] || LANGUAGE_MAP.en;
};

export default LANGUAGE_MAP;
