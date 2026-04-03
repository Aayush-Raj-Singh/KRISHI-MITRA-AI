const SCRIPT_RANGES: Record<string, Array<[number, number]>> = {
  hi: [[0x0900, 0x097f]],
  mr: [[0x0900, 0x097f]],
  ne: [[0x0900, 0x097f]],
  sa: [[0x0900, 0x097f]],
  bn: [[0x0980, 0x09ff]],
  as: [[0x0980, 0x09ff]],
  gu: [[0x0a80, 0x0aff]],
  pa: [[0x0a00, 0x0a7f]],
  ta: [[0x0b80, 0x0bff]],
  te: [[0x0c00, 0x0c7f]],
  kn: [[0x0c80, 0x0cff]],
  ml: [[0x0d00, 0x0d7f]],
  or: [[0x0b00, 0x0b7f]],
  ur: [
    [0x0600, 0x06ff],
    [0x0750, 0x077f],
    [0x08a0, 0x08ff],
    [0xfb50, 0xfdff],
    [0xfe70, 0xfeff],
  ],
};

const normalizeLanguage = (language?: string) => (language || "en").toLowerCase().split("-")[0];

const hasLatin1 = (value: string) => /[\u0080-\u00ff]/.test(value);

const latin1Score = (value: string) => {
  let score = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code >= 0x80 && code <= 0xff) score += 1;
  }
  return score;
};

const hasScriptForLanguage = (value: string, language?: string) => {
  const ranges = SCRIPT_RANGES[normalizeLanguage(language)];
  if (!ranges) return false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    for (const [start, end] of ranges) {
      if (code >= start && code <= end) return true;
    }
  }
  return false;
};

export const repairMojibake = (value: string, language?: string) => {
  if (!value || !hasLatin1(value)) return value;
  if (latin1Score(value) < 2) return value;

  const bytes = new Uint8Array(value.length);
  let hasHighByte = false;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code > 0xff) {
      return value;
    }
    if (code >= 0x80) hasHighByte = true;
    bytes[i] = code;
  }

  if (!hasHighByte) return value;
  if (typeof TextDecoder === "undefined") return value;

  let decoded = value;
  try {
    decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return value;
  }

  if (decoded.includes("\uFFFD")) {
    return value;
  }

  if (hasScriptForLanguage(decoded, language) && !hasScriptForLanguage(value, language)) {
    return decoded;
  }

  if (latin1Score(decoded) < latin1Score(value)) {
    return decoded;
  }

  return value;
};

export const isCorruptedTranslation = (value: string, language?: string) => {
  const lang = normalizeLanguage(language);
  if (!value || lang === "en") return false;
  if (hasScriptForLanguage(value, lang)) return false;
  return hasLatin1(value);
};
