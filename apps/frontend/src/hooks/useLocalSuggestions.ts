import { useCallback, useMemo, useState } from "react";

const MAX_SUGGESTIONS = 12;

const readSuggestions = (key: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`krishimitra:suggestions:${key}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeSuggestions = (key: string, values: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`krishimitra:suggestions:${key}`, JSON.stringify(values));
  } catch {}
};

const normalize = (value: string) => value.trim();

export const useLocalSuggestions = (key: string, seed: string[] = []) => {
  const [suggestions, setSuggestions] = useState<string[]>(() => {
    const stored = readSuggestions(key);
    return Array.from(new Set([...seed, ...stored].map(normalize).filter(Boolean)));
  });

  const addSuggestion = useCallback(
    (value: string) => {
      const cleaned = normalize(value);
      if (!cleaned) return;
      const next = [cleaned, ...suggestions.filter((item) => item !== cleaned)].slice(
        0,
        MAX_SUGGESTIONS,
      );
      setSuggestions(next);
      writeSuggestions(key, next);
    },
    [key, suggestions],
  );

  const merged = useMemo(() => Array.from(new Set([...seed, ...suggestions])), [seed, suggestions]);

  return { suggestions: merged, addSuggestion };
};

export default useLocalSuggestions;
