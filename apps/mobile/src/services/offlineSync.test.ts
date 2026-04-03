import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  submitOutcomeFeedback: vi.fn(),
  submitQuickFeedback: vi.fn(),
  readOfflineQueue: vi.fn(),
  writeOfflineQueue: vi.fn(),
}));

vi.mock("./api/client", () => ({
  feedbackApi: {
    submitOutcomeFeedback: mocks.submitOutcomeFeedback,
    submitQuickFeedback: mocks.submitQuickFeedback,
  },
}));

vi.mock("./storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./storage")>();
  return {
    ...actual,
    enqueueOfflineQueueItem: vi.fn(),
    readOfflineQueue: mocks.readOfflineQueue,
    writeOfflineQueue: mocks.writeOfflineQueue,
  };
});

import { syncOfflineQueue } from "./offlineSync";

describe("syncOfflineQueue", () => {
  beforeEach(() => {
    mocks.submitOutcomeFeedback.mockReset();
    mocks.submitQuickFeedback.mockReset();
    mocks.readOfflineQueue.mockReset();
    mocks.writeOfflineQueue.mockReset();
  });

  it("flushes successful items and keeps failed ones with retry metadata", async () => {
    mocks.readOfflineQueue.mockResolvedValue([
      {
        id: "outcome_1",
        kind: "outcome_feedback",
        payload: { recommendation_id: "r1" },
        createdAt: new Date().toISOString(),
        attempts: 0,
      },
      {
        id: "quick_1",
        kind: "quick_feedback",
        payload: { recommendation_id: "r2", rating: 4, service: "crop" },
        createdAt: new Date().toISOString(),
        attempts: 1,
      },
    ]);
    mocks.submitOutcomeFeedback.mockResolvedValue({ ok: true });
    mocks.submitQuickFeedback.mockRejectedValue(new Error("offline"));

    const processed = await syncOfflineQueue();

    expect(processed).toBe(1);
    expect(mocks.writeOfflineQueue).toHaveBeenCalledTimes(1);
    const remaining = mocks.writeOfflineQueue.mock.calls[0][0];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].attempts).toBe(2);
    expect(remaining[0].lastError).toBe("offline");
    expect(remaining[0].nextRetryAt).toBeTruthy();
  });
});
