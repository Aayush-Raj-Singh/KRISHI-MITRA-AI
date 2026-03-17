import api, { ApiResponse, unwrap } from "./api";

export interface ChatRequest {
  message: string;
  language?: string | null;
}

export interface ChatSource {
  title: string;
  reference: string;
}

export interface ChatResponse {
  reply: string;
  language: string;
  model: string;
  sources: ChatSource[];
  is_fallback: boolean;
  latency_ms: number;
  conversation_id: string;
  created_at: string;
}

export interface AdvisorySlaTelemetry {
  window_minutes: number;
  total_requests: number;
  successful_requests: number;
  fallback_responses: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  sla_target_ms: number;
  sla_compliant: boolean;
  language_distribution: Record<string, number>;
  generated_at: string;
}

export interface AdvisoryTranslateRequest {
  texts: string[];
  target_language: string;
  source_language?: string;
}

export interface AdvisoryTranslateResponse {
  target_language: string;
  source_language: string;
  translations: Record<string, string>;
}

export const sendAdvisoryMessage = async (payload: ChatRequest): Promise<ChatResponse> => {
  const response = await api.post<ApiResponse<ChatResponse>>("/advisory/chat", payload);
  return unwrap(response.data);
};

export const fetchAdvisorySlaTelemetry = async (params?: {
  window_minutes?: number;
  sla_target_ms?: number;
}): Promise<AdvisorySlaTelemetry> => {
  const response = await api.get<ApiResponse<AdvisorySlaTelemetry>>("/advisory/telemetry/sla", { params });
  return unwrap(response.data);
};

export const translateAdvisoryText = async (
  payload: AdvisoryTranslateRequest
): Promise<AdvisoryTranslateResponse> => {
  const response = await api.post<ApiResponse<AdvisoryTranslateResponse>>("/advisory/translate", {
    ...payload,
    source_language: payload.source_language ?? "auto",
  });
  return unwrap(response.data);
};
