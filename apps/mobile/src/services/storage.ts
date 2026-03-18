import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  OutcomeFeedbackRequest,
  QuickFeedbackRequest
} from "@krishimitra/shared";

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
    updatedAt: new Date().toISOString()
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
  item: Omit<OfflineQueueItem, "id" | "createdAt">
): Promise<OfflineQueueItem> => {
  const nextItem: OfflineQueueItem = {
    id: `${item.kind}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...item
  };
  const current = await readOfflineQueue();
  current.push(nextItem);
  await writeOfflineQueue(current);
  return nextItem;
};
