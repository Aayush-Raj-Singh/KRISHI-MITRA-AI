import api, { ApiResponse, unwrap } from "./api";

export interface SchedulerHook {
  key: string;
  title: string;
  cadence: string;
  schedule_expression: string;
  command: string;
  eventbridge_ready_note: string;
  last_status?: string | null;
  last_run_at?: string | null;
}

export interface OperationRunItem {
  run_id: string;
  operation: string;
  status: string;
  triggered_by: string;
  mode: string;
  triggered_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  error?: string | null;
  result?: Record<string, unknown> | null;
}

export interface SchedulerOverviewResponse {
  hooks: SchedulerHook[];
  recent_runs: OperationRunItem[];
}

export interface TriggerOperationResponse {
  run_id: string;
  operation: string;
  status: string;
  triggered_at: string;
  triggered_by: string;
  mode: string;
  result?: Record<string, unknown> | null;
}

export const fetchSchedulerOverview = async (): Promise<SchedulerOverviewResponse> => {
  const response = await api.get<ApiResponse<SchedulerOverviewResponse>>("/operations/schedule");
  return unwrap(response.data);
};

export const triggerWeeklyPriceRefresh = async (asyncMode = true): Promise<TriggerOperationResponse> => {
  const response = await api.post<ApiResponse<TriggerOperationResponse>>(
    `/operations/schedule/trigger/weekly-price-refresh`,
    null,
    { params: { async_mode: asyncMode } }
  );
  return unwrap(response.data);
};

export const triggerQuarterlyRetrain = async (asyncMode = true): Promise<TriggerOperationResponse> => {
  const response = await api.post<ApiResponse<TriggerOperationResponse>>(
    `/operations/schedule/trigger/quarterly-retrain`,
    null,
    { params: { async_mode: asyncMode } }
  );
  return unwrap(response.data);
};

export const triggerDailyDataRefresh = async (asyncMode = true): Promise<TriggerOperationResponse> => {
  const response = await api.post<ApiResponse<TriggerOperationResponse>>(
    `/operations/schedule/trigger/daily-data-refresh`,
    null,
    { params: { async_mode: asyncMode } }
  );
  return unwrap(response.data);
};
