const buildKey = (key: string) => `krishimitra:${key}`;

export const setCached = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(buildKey(key), JSON.stringify({ value, ts: Date.now() }));
  } catch {
  }
};

export const getCached = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(buildKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: T };
    return parsed.value;
  } catch {
    return null;
  }
};

export const getCachedWithMeta = <T,>(key: string): { value: T; ts: number } | null => {
  try {
    const raw = localStorage.getItem(buildKey(key));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { value: T; ts: number };
    if (!parsed || typeof parsed.ts !== "number") return null;
    return { value: parsed.value, ts: parsed.ts };
  } catch {
    return null;
  }
};
