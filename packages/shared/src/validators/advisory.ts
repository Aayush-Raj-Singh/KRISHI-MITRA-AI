import type { ChatRequest, TranslationRequest } from "../contracts/advisory";
import { requireText } from "./shared";

export const sanitizeChatPayload = (payload: ChatRequest): ChatRequest => ({
  message: requireText(payload.message, "Message"),
  language: payload.language?.trim() || undefined
});

export const sanitizeTranslationPayload = (payload: TranslationRequest): TranslationRequest => ({
  texts: payload.texts.map((item) => requireText(item, "Translation text")),
  target_language: requireText(payload.target_language, "Target language"),
  source_language: payload.source_language?.trim() || "auto"
});
