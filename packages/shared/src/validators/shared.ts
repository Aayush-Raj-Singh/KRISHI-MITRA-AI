export const requireText = (value: string | null | undefined, label: string): string => {
  const normalized = (value || "").trim();
  if (!normalized) {
    throw new Error(`${label} is required`);
  }
  return normalized;
};

export const toFiniteNumber = (value: unknown, label: string): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} must be a valid number`);
  }
  return numeric;
};

export const ensureMinValue = (value: number, min: number, label: string): number => {
  if (value < min) {
    throw new Error(`${label} must be at least ${min}`);
  }
  return value;
};

export const ensureRange = (value: number, min: number, max: number, label: string): number => {
  if (value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${max}`);
  }
  return value;
};

export const compactStringArray = (values: Array<string | null | undefined>): string[] =>
  values.map((value) => (value || "").trim()).filter(Boolean);
