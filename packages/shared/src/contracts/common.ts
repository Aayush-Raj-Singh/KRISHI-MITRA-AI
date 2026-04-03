export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiRequestOptions {
  params?: object;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  responseType?: "json" | "text" | "blob";
}

export type Role =
  | "farmer"
  | "extension_officer"
  | "fpo"
  | "agri_business"
  | "government_agency"
  | "admin";

export type Nullable<T> = T | null;

export interface PaginatedRequest {
  limit?: number;
}
