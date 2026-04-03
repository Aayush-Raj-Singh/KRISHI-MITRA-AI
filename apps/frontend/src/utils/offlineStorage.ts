type OfflineStoreName = "weather" | "mandi" | "session" | "api" | "images" | "queue";

export type OfflineRecord<T> = {
  key: string;
  value: T;
  updatedAt: string;
};

export type OfflineMutationRecord = {
  id: string;
  method: "POST";
  url: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  nextAttemptAt?: string;
  lastError?: string;
};

const DB_NAME = "krishimitra_offline";
const DB_VERSION = 2;
const STORE_NAMES: OfflineStoreName[] = ["weather", "mandi", "session", "api", "images", "queue"];

const isBrowser = typeof window !== "undefined";
const memoryStore = new Map<string, OfflineRecord<unknown>>();

const openDatabase = (): Promise<IDBDatabase> => {
  if (!isBrowser || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB not available"));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORE_NAMES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: "key" });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open offline DB"));
  });
};

const withStore = async <T>(
  store: OfflineStoreName,
  mode: IDBTransactionMode,
  handler: (storeRef: IDBObjectStore) => Promise<T>,
): Promise<T | null> => {
  try {
    const db = await openDatabase();
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const storeRef = tx.objectStore(store);
      let settled = false;

      const resolveOnce = (value: T) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };

      const rejectOnce = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      handler(storeRef).then(resolveOnce).catch(rejectOnce);
      tx.oncomplete = () => db.close();
      tx.onerror = () => rejectOnce(tx.error || new Error("Offline transaction failed"));
      tx.onabort = () => rejectOnce(tx.error || new Error("Offline transaction aborted"));
    });
  } catch {
    return null;
  }
};

const buildMemoryKey = (store: OfflineStoreName, key: string) => `${store}:${key}`;

const getMemoryRecord = <T>(store: OfflineStoreName, key: string): OfflineRecord<T> | null =>
  (memoryStore.get(buildMemoryKey(store, key)) as OfflineRecord<T> | undefined) || null;

const getMemoryRecords = <T>(store: OfflineStoreName): OfflineRecord<T>[] =>
  [...memoryStore.entries()]
    .filter(([memoryKey]) => memoryKey.startsWith(`${store}:`))
    .map(([, value]) => value as OfflineRecord<T>);

const setMemoryRecord = <T>(store: OfflineStoreName, key: string, value: T): OfflineRecord<T> => {
  const record: OfflineRecord<T> = { key, value, updatedAt: new Date().toISOString() };
  memoryStore.set(buildMemoryKey(store, key), record as OfflineRecord<unknown>);
  return record;
};

export const isOnline = (): boolean => {
  if (!isBrowser) return true;
  return navigator.onLine;
};

export const saveOfflineRecord = async <T>(
  store: OfflineStoreName,
  key: string,
  value: T,
): Promise<OfflineRecord<T> | null> => {
  const record: OfflineRecord<T> = { key, value, updatedAt: new Date().toISOString() };
  const stored = await withStore(store, "readwrite", (storeRef) => {
    return new Promise<OfflineRecord<T>>((resolve, reject) => {
      const request = storeRef.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error || new Error("Failed to store offline record"));
    });
  });
  if (!stored) {
    return setMemoryRecord(store, key, value);
  }
  return stored;
};

export const getOfflineRecord = async <T>(
  store: OfflineStoreName,
  key: string,
): Promise<OfflineRecord<T> | null> => {
  const record = await withStore(store, "readonly", (storeRef) => {
    return new Promise<OfflineRecord<T> | null>((resolve, reject) => {
      const request = storeRef.get(key);
      request.onsuccess = () => resolve((request.result as OfflineRecord<T> | undefined) || null);
      request.onerror = () => reject(request.error || new Error("Failed to read offline record"));
    });
  });
  if (record) return record;
  return getMemoryRecord<T>(store, key);
};

export const listOfflineRecords = async <T>(
  store: OfflineStoreName,
): Promise<OfflineRecord<T>[]> => {
  const records = await withStore(store, "readonly", (storeRef) => {
    return new Promise<OfflineRecord<T>[]>((resolve, reject) => {
      const request = storeRef.getAll();
      request.onsuccess = () => resolve((request.result as OfflineRecord<T>[] | undefined) || []);
      request.onerror = () => reject(request.error || new Error("Failed to list offline records"));
    });
  });
  if (records) {
    return [...records].sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  }
  return getMemoryRecords<T>(store).sort((left, right) =>
    left.updatedAt.localeCompare(right.updatedAt),
  );
};

export const removeOfflineRecord = async (store: OfflineStoreName, key: string): Promise<void> => {
  await withStore(store, "readwrite", (storeRef) => {
    return new Promise<void>((resolve, reject) => {
      const request = storeRef.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to delete offline record"));
    });
  });
  memoryStore.delete(buildMemoryKey(store, key));
};

export const saveOfflineSessionSnapshot = (payload: { user?: unknown }) => {
  void saveOfflineRecord("session", "current", payload);
  setMemoryRecord("session", "current", payload);
};

export const getOfflineSessionSnapshot = async () => {
  return getOfflineRecord<{ user?: unknown }>("session", "current");
};

export const enqueueOfflineMutation = async (
  url: string,
  payload: unknown,
): Promise<OfflineMutationRecord | null> => {
  const record: OfflineMutationRecord = {
    id: `mutation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    method: "POST",
    url,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    nextAttemptAt: new Date().toISOString(),
  };
  await saveOfflineRecord("queue", record.id, record);
  return record;
};

export const listOfflineMutations = async (): Promise<OfflineMutationRecord[]> => {
  const records = await listOfflineRecords<OfflineMutationRecord>("queue");
  return records
    .map((record) => record.value)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
};

export const updateOfflineMutation = async (record: OfflineMutationRecord): Promise<void> => {
  await saveOfflineRecord("queue", record.id, record);
};

export const removeOfflineMutation = async (id: string): Promise<void> => {
  await removeOfflineRecord("queue", id);
};

export const scheduleOfflineMutationRetry = (
  record: OfflineMutationRecord,
  error: unknown,
): OfflineMutationRecord => {
  const attempts = record.attempts + 1;
  const retryDelayMs = Math.min(15 * 60 * 1000, 1000 * 2 ** Math.min(attempts, 8));
  return {
    ...record,
    attempts,
    lastAttemptAt: new Date().toISOString(),
    nextAttemptAt: new Date(Date.now() + retryDelayMs).toISOString(),
    lastError:
      error instanceof Error
        ? error.message.slice(0, 500)
        : String(error || "Request failed").slice(0, 500),
  };
};
