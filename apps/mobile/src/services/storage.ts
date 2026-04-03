import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OutcomeFeedbackRequest, QuickFeedbackRequest } from "@krishimitra/shared";

const CACHE_PREFIX = "krishimitra:mobile:cache:";
const OFFLINE_QUEUE_KEY = "krishimitra:mobile:offline-queue";

export interface CacheRecord<T> {
  value: T;
  updatedAt: string;
}

export interface OfflineQueueItem {
  id: string;
  kind: "outcome_feedback" | "quick_feedback";
  payload: OutcomeFeedbackRequest | QuickFeedbackRequest;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  lastError?: string;
}

export const buildCacheKey = (scope: string, payload?: unknown) => {
  if (payload === undefined) {
    return scope;
  }
  return `${scope}:${JSON.stringify(payload)}`;
};

export const readCacheRecord = async <T>(key: string): Promise<CacheRecord<T> | null> => {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CacheRecord<T>;
  } catch {
    return null;
  }
};

export const writeCacheRecord = async <T>(key: string, value: T): Promise<void> => {
  const record: CacheRecord<T> = {
    value,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(record));
};

export const readOfflineQueue = async (): Promise<OfflineQueueItem[]> => {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as OfflineQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeOfflineQueue = async (items: OfflineQueueItem[]): Promise<void> => {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
};

export const enqueueOfflineQueueItem = async (
  item: Omit<
    OfflineQueueItem,
    "id" | "createdAt" | "attempts" | "lastAttemptAt" | "nextRetryAt" | "lastError"
  >,
): Promise<OfflineQueueItem> => {
  const nextItem: OfflineQueueItem = {
    id: `${item.kind}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    attempts: 0,
    ...item,
  };
  const current = await readOfflineQueue();
  current.push(nextItem);
  await writeOfflineQueue(current);
  return nextItem;
};

export const scheduleOfflineQueueRetry = (
  item: OfflineQueueItem,
  error: unknown,
): OfflineQueueItem => {
  const attempts = item.attempts + 1;
  const retryDelayMs = Math.min(15 * 60 * 1000, 1000 * 2 ** Math.min(attempts, 8));
  return {
    ...item,
    attempts,
    lastAttemptAt: new Date().toISOString(),
    nextRetryAt: new Date(Date.now() + retryDelayMs).toISOString(),
    lastError:
      error instanceof Error
        ? error.message.slice(0, 500)
        : String(error || "Request failed").slice(0, 500),
  };
};
