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
};

const DB_NAME = "krishimitra_offline";
const DB_VERSION = 2;
const STORE_NAMES: OfflineStoreName[] = ["weather", "mandi", "session", "api", "images", "queue"];
const LOCAL_PREFIX = "krishimitra:offline";
const NO_LOCAL_FALLBACK_STORES = new Set<OfflineStoreName>(["queue"]);

const isBrowser = typeof window !== "undefined";

const buildLocalKey = (store: OfflineStoreName, key: string) => `${LOCAL_PREFIX}:${store}:${key}`;

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
  handler: (storeRef: IDBObjectStore) => Promise<T>
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

const canUseLocalFallback = (store: OfflineStoreName) => !NO_LOCAL_FALLBACK_STORES.has(store);

const getLocalRecord = <T>(store: OfflineStoreName, key: string): OfflineRecord<T> | null => {
  if (!isBrowser || !canUseLocalFallback(store)) return null;
  try {
    const raw = localStorage.getItem(buildLocalKey(store, key));
    if (!raw) return null;
    return JSON.parse(raw) as OfflineRecord<T>;
  } catch {
    return null;
  }
};

const getLocalRecords = <T>(store: OfflineStoreName): OfflineRecord<T>[] => {
  if (!isBrowser || !canUseLocalFallback(store)) return [];
  const prefix = `${LOCAL_PREFIX}:${store}:`;
  const records: OfflineRecord<T>[] = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || !key.startsWith(prefix)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        records.push(JSON.parse(raw) as OfflineRecord<T>);
      } catch {
      }
    }
  } catch {
  }
  return records;
};

const setLocalRecord = <T>(store: OfflineStoreName, key: string, value: T): OfflineRecord<T> | null => {
  if (!isBrowser || !canUseLocalFallback(store)) return null;
  try {
    const record: OfflineRecord<T> = { key, value, updatedAt: new Date().toISOString() };
    localStorage.setItem(buildLocalKey(store, key), JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
};

export const isOnline = (): boolean => {
  if (!isBrowser) return true;
  return navigator.onLine;
};

export const saveOfflineRecord = async <T>(store: OfflineStoreName, key: string, value: T): Promise<OfflineRecord<T> | null> => {
  const record: OfflineRecord<T> = { key, value, updatedAt: new Date().toISOString() };
  const stored = await withStore(store, "readwrite", (storeRef) => {
    return new Promise<OfflineRecord<T>>((resolve, reject) => {
      const request = storeRef.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error || new Error("Failed to store offline record"));
    });
  });
  if (!stored) {
    return setLocalRecord(store, key, value);
  }
  return stored;
};

export const getOfflineRecord = async <T>(store: OfflineStoreName, key: string): Promise<OfflineRecord<T> | null> => {
  const record = await withStore(store, "readonly", (storeRef) => {
    return new Promise<OfflineRecord<T> | null>((resolve, reject) => {
      const request = storeRef.get(key);
      request.onsuccess = () => resolve((request.result as OfflineRecord<T> | undefined) || null);
      request.onerror = () => reject(request.error || new Error("Failed to read offline record"));
    });
  });
  if (record) return record;
  return getLocalRecord<T>(store, key);
};

export const listOfflineRecords = async <T>(store: OfflineStoreName): Promise<OfflineRecord<T>[]> => {
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
  return getLocalRecords<T>(store).sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
};

export const removeOfflineRecord = async (store: OfflineStoreName, key: string): Promise<void> => {
  await withStore(store, "readwrite", (storeRef) => {
    return new Promise<void>((resolve, reject) => {
      const request = storeRef.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error || new Error("Failed to delete offline record"));
    });
  });
  if (isBrowser && canUseLocalFallback(store)) {
    try {
      localStorage.removeItem(buildLocalKey(store, key));
    } catch {
    }
  }
};

export const saveOfflineSessionSnapshot = (payload: { user?: unknown }) => {
  void saveOfflineRecord("session", "current", payload);
  setLocalRecord("session", "current", payload);
};

export const getOfflineSessionSnapshot = async () => {
  return getOfflineRecord<{ user?: unknown }>("session", "current");
};

export const enqueueOfflineMutation = async (url: string, payload: unknown): Promise<OfflineMutationRecord | null> => {
  const record: OfflineMutationRecord = {
    id: `mutation_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    method: "POST",
    url,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0
  };
  await saveOfflineRecord("queue", record.id, record);
  return record;
};

export const listOfflineMutations = async (): Promise<OfflineMutationRecord[]> => {
  const records = await listOfflineRecords<OfflineMutationRecord>("queue");
  return records.map((record) => record.value).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
};

export const updateOfflineMutation = async (record: OfflineMutationRecord): Promise<void> => {
  await saveOfflineRecord("queue", record.id, record);
};

export const removeOfflineMutation = async (id: string): Promise<void> => {
  await removeOfflineRecord("queue", id);
};
