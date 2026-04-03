import HttpError from "./httpError.js";

const BLOCKED_PATTERNS = [
  /\bkill\s+(?:people|person|human|someone|animals?)\b/i,
  /\bpoison\s+(?:people|person|food|water|animals?)\b/i,
  /\bexplosive\b/i,
  /\bweapon\b/i,
  /\bsuicide\b/i,
  /\bself-harm\b/i,
];

export const assertSafeAdvisorQuery = (query) => {
  const normalized = String(query || "").trim();
  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new HttpError(400, "This advisor only supports safe crop and farm queries.");
  }
};

export default assertSafeAdvisorQuery;
