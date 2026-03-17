import api, { ApiResponse, unwrap } from "./api";

export interface DataQualityIssue {
  issue_type: string;
  severity: string;
  message: string;
  entry_id?: string;
  fields?: Record<string, unknown>;
  detected_at: string;
}

export interface DataQualitySummary {
  total: number;
  by_severity: Record<string, number>;
  by_type: Record<string, number>;
}

export interface DataQualityReport {
  issues: DataQualityIssue[];
  summary: DataQualitySummary;
  generated_at: string;
}

export const fetchDataQualityReport = async (params?: {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
  date_from?: string;
  date_to?: string;
}) => {
  const response = await api.get<ApiResponse<DataQualityReport>>("/quality/mandi", { params });
  return unwrap(response.data);
};

export const fetchQualityIssues = async () => {
  const response = await api.get<ApiResponse<unknown[]>>("/quality/issues");
  return unwrap(response.data);
};
