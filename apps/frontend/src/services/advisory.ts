import {
  createAdvisoryApi,
  type AdvisorySlaTelemetry,
  type ChatRequest,
  type ChatResponse,
  type TranslationRequest as AdvisoryTranslateRequest,
  type TranslationResponse as AdvisoryTranslateResponse
} from "@krishimitra/shared";

import api, { unwrap } from "./api";

const advisoryApi = createAdvisoryApi({ api, unwrap });

export type {
  AdvisorySlaTelemetry,
  AdvisoryTranslateRequest,
  AdvisoryTranslateResponse,
  ChatRequest,
  ChatResponse
};

export const sendAdvisoryMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  return advisoryApi.sendMessage(payload);
};

export const fetchAdvisorySlaTelemetry = async (params?: {
  window_minutes?: number;
  sla_target_ms?: number;
}): Promise<AdvisorySlaTelemetry> => {
  return advisoryApi.getSlaTelemetry(params);
};

export const translateAdvisoryText = async (
  payload: AdvisoryTranslateRequest
): Promise<AdvisoryTranslateResponse> => {
  return advisoryApi.translate({
    ...payload,
    source_language: payload.source_language ?? "auto",
  });
};
