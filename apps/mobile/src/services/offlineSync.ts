import {
  ApiError,
  type OutcomeFeedbackRequest,
  type OutcomeFeedbackResponse,
  type QuickFeedbackRequest,
  type QuickFeedbackResponse
} from "@krishimitra/shared";

import { feedbackApi } from "./api/client";
import {
  enqueueOfflineQueueItem,
  readOfflineQueue,
  writeOfflineQueue
} from "./storage";

const isOfflineCandidate = (error: unknown) =>
  error instanceof ApiError && (error.status === undefined || error.message.includes("Unable to reach"));

export const submitOutcomeFeedbackOrQueue = async (
  payload: OutcomeFeedbackRequest
): Promise<OutcomeFeedbackResponse> => {
  try {
    return await feedbackApi.submitOutcomeFeedback(payload);
  } catch (error) {
    if (!isOfflineCandidate(error)) {
      throw error;
    }
    await enqueueOfflineQueueItem({
      kind: "outcome_feedback",
      payload
    });
    return {
      feedback_id: "queued",
      sustainability_score: 0,
      sub_scores: {
        water_efficiency: 0,
        fertilizer_efficiency: 0,
        yield_optimization: 0
      },
      recommendations: ["Feedback queued. It will sync automatically when the app reconnects."],
      created_at: new Date().toISOString()
    };
  }
};

export const submitQuickFeedbackOrQueue = async (
  payload: QuickFeedbackRequest
): Promise<QuickFeedbackResponse> => {
  try {
    return await feedbackApi.submitQuickFeedback(payload);
  } catch (error) {
    if (!isOfflineCandidate(error)) {
      throw error;
    }
    await enqueueOfflineQueueItem({
      kind: "quick_feedback",
      payload
    });
    return {
      feedback_id: "queued",
      recommendation_id: payload.recommendation_id,
      rating: payload.rating,
      service: payload.service,
      notes: payload.notes,
      created_at: new Date().toISOString()
    };
  }
};

export const syncOfflineQueue = async (): Promise<number> => {
  const queue = await readOfflineQueue();
  if (queue.length === 0) {
    return 0;
  }

  const remaining = [];
  let processed = 0;

  for (const item of queue) {
    try {
      if (item.kind === "outcome_feedback") {
        await feedbackApi.submitOutcomeFeedback(item.payload as OutcomeFeedbackRequest);
      }
      if (item.kind === "quick_feedback") {
        await feedbackApi.submitQuickFeedback(item.payload as QuickFeedbackRequest);
      }
      processed += 1;
    } catch {
      remaining.push(item);
    }
  }

  await writeOfflineQueue(remaining);
  return processed;
};
