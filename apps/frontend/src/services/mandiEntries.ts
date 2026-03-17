import api, { ApiResponse, unwrap } from "./api";

export interface MandiEntry {
  _id: string;
  commodity: string;
  variety?: string;
  grade?: string;
  market: string;
  arrival_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrivals_qtl: number;
  status: string;
  state?: string;
  district?: string;
}

export interface MandiEntryList {
  items: MandiEntry[];
  total: number;
}

export const createMandiEntry = async (payload: Record<string, unknown>) => {
  const response = await api.post<ApiResponse<MandiEntry>>("/mandi/entries", payload);
  return unwrap(response.data);
};

export const fetchMandiEntries = async (params?: {
  status?: string;
  market?: string;
  commodity?: string;
  limit?: number;
  skip?: number;
}) => {
  const response = await api.get<ApiResponse<MandiEntryList>>("/mandi/entries", { params });
  return unwrap(response.data);
};

export const submitMandiEntry = async (entryId: string) => {
  const response = await api.post<ApiResponse<MandiEntry>>(`/mandi/entries/${entryId}/submit`);
  return unwrap(response.data);
};

export const approveMandiEntry = async (entryId: string) => {
  const response = await api.post<ApiResponse<MandiEntry>>(`/mandi/entries/${entryId}/approve`);
  return unwrap(response.data);
};

export const rejectMandiEntry = async (entryId: string, reason?: string) => {
  const response = await api.post<ApiResponse<MandiEntry>>(`/mandi/entries/${entryId}/reject`, {}, {
    params: reason ? { reason } : undefined
  });
  return unwrap(response.data);
};
