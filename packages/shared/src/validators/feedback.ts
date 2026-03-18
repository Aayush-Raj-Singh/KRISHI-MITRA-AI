import type {
  OutcomeFeedbackRequest,
  QuickFeedbackRequest
} from "../contracts/feedback";
import { ensureMinValue, ensureRange, requireText, toFiniteNumber } from "./shared";

export const sanitizeOutcomeFeedbackPayload = (
  payload: OutcomeFeedbackRequest
): OutcomeFeedbackRequest => ({
  ...payload,
  recommendation_id: requireText(payload.recommendation_id, "Recommendation ID"),
  rating: ensureRange(toFiniteNumber(payload.rating, "Rating"), 1, 5, "Rating"),
  yield_kg_per_acre: ensureMinValue(
    toFiniteNumber(payload.yield_kg_per_acre, "Yield"),
    0.01,
    "Yield"
  ),
  income_inr: ensureMinValue(toFiniteNumber(payload.income_inr, "Income"), 0.01, "Income"),
  water_usage_l_per_acre: ensureMinValue(
    toFiniteNumber(payload.water_usage_l_per_acre, "Water usage"),
    0.01,
    "Water usage"
  ),
  fertilizer_kg_per_acre: ensureMinValue(
    toFiniteNumber(payload.fertilizer_kg_per_acre, "Fertilizer usage"),
    0.01,
    "Fertilizer usage"
  ),
  notes: payload.notes?.trim() || undefined,
  season: payload.season?.trim() || undefined
});

export const sanitizeQuickFeedbackPayload = (payload: QuickFeedbackRequest): QuickFeedbackRequest => ({
  ...payload,
  recommendation_id: payload.recommendation_id?.trim() || undefined,
  rating: ensureRange(toFiniteNumber(payload.rating, "Rating"), 1, 5, "Rating"),
  service: payload.service,
  notes: payload.notes?.trim() || undefined,
  source: payload.source?.trim() || undefined
});
