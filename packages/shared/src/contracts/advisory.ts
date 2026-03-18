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

export interface ChatHistoryMessage {
  role: string;
  content: string;
  language?: string | null;
  timestamp?: string | null;
}

export interface ChatHistoryResponse {
  messages: ChatHistoryMessage[];
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

export interface TranslationRequest {
  texts: string[];
  target_language: string;
  source_language?: string;
}

export interface TranslationResponse {
  target_language: string;
  source_language: string;
  translations: Record<string, string>;
}
