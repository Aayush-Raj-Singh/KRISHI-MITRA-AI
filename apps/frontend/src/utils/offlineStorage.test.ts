import { beforeEach, describe, expect, it } from "vitest";

import {
  enqueueOfflineMutation,
  listOfflineMutations,
  removeOfflineMutation,
  saveOfflineRecord
} from "./offlineStorage";

const resetOfflineDb = async () => {
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase("krishimitra_offline");
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
};

describe("offlineStorage", () => {
  beforeEach(async () => {
    await resetOfflineDb();
  });

  it("stores offline mutations in IndexedDB without mirroring queue data to localStorage", async () => {
    await enqueueOfflineMutation("/feedback/outcome", { rating: 5, crop: "rice" });

    const queued = await listOfflineMutations();
    expect(queued).toHaveLength(1);
    expect(queued[0]?.url).toBe("/feedback/outcome");
    expect(window.localStorage.length).toBe(0);
  });

  it("removes queued mutations cleanly", async () => {
    await enqueueOfflineMutation("/feedback/outcome", { rating: 4 });
    const queued = await listOfflineMutations();

    expect(queued).toHaveLength(1);
    await removeOfflineMutation(queued[0].id);

    const remaining = await listOfflineMutations();
    expect(remaining).toHaveLength(0);
  });

  it("still allows non-queue offline caches to be written", async () => {
    const record = await saveOfflineRecord("api", "weather:patna", { temp: 31 });

    expect(record?.key).toBe("weather:patna");
    expect(record?.value).toEqual({ temp: 31 });
  });
});
