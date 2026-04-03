import type { CropAdvisorRequest } from "../contracts/aiAdvisor";
import { requireText } from "./shared";

export const sanitizeCropAdvisorPayload = (payload: CropAdvisorRequest): CropAdvisorRequest => ({
  location: requireText(payload.location, "Location").slice(0, 120),
  crop: requireText(payload.crop, "Crop").slice(0, 120),
  query: requireText(payload.query, "Query").slice(0, 1000),
  language: payload.language?.trim() || undefined,
});
