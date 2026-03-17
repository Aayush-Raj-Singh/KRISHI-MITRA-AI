import api, { ApiResponse, unwrap } from "./api";

export interface MandiContact {
  person?: string;
  phone?: string;
  email?: string;
}

export interface MandiDirectoryItem {
  mandi_id: string;
  name: string;
  state: string;
  district?: string;
  timings?: string;
  facilities: string[];
  contact?: MandiContact;
  major_commodities: string[];
  transport_info?: string;
}

export interface MandiDirectoryFilters {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
  limit?: number;
}

export const fetchMandiDirectory = async (filters: MandiDirectoryFilters): Promise<MandiDirectoryItem[]> => {
  const response = await api.get<ApiResponse<MandiDirectoryItem[]>>("/mandi-directory", { params: filters });
  return unwrap(response.data);
};

export const fetchMandiProfile = async (mandiId: string): Promise<MandiDirectoryItem> => {
  const response = await api.get<ApiResponse<MandiDirectoryItem>>(`/mandi-directory/${mandiId}`);
  return unwrap(response.data);
};
