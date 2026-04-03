import api, { ApiResponse, unwrap } from "./api";

export const fetchCommodities = async () => {
  const response = await api.get<ApiResponse<unknown[]>>("/master/commodities");
  return unwrap(response.data);
};

export const createCommodity = async (payload: {
  name: string;
  code: string;
  categories: string[];
  active: boolean;
}) => {
  const response = await api.post<ApiResponse<unknown>>("/master/commodities", payload);
  return unwrap(response.data);
};

export const updateCommodity = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch<ApiResponse<unknown>>(`/master/commodities/${id}`, payload);
  return unwrap(response.data);
};

export const fetchVarieties = async (params?: { commodity_id?: string }) => {
  const response = await api.get<ApiResponse<unknown[]>>("/master/varieties", { params });
  return unwrap(response.data);
};

export const createVariety = async (payload: {
  commodity_id: string;
  name: string;
  code: string;
  active: boolean;
}) => {
  const response = await api.post<ApiResponse<unknown>>("/master/varieties", payload);
  return unwrap(response.data);
};

export const updateVariety = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch<ApiResponse<unknown>>(`/master/varieties/${id}`, payload);
  return unwrap(response.data);
};

export const fetchGrades = async (params?: { commodity_id?: string }) => {
  const response = await api.get<ApiResponse<unknown[]>>("/master/grades", { params });
  return unwrap(response.data);
};

export const createGrade = async (payload: {
  commodity_id: string;
  name: string;
  code: string;
  active: boolean;
}) => {
  const response = await api.post<ApiResponse<unknown>>("/master/grades", payload);
  return unwrap(response.data);
};

export const updateGrade = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch<ApiResponse<unknown>>(`/master/grades/${id}`, payload);
  return unwrap(response.data);
};

export const fetchUnits = async () => {
  const response = await api.get<ApiResponse<unknown[]>>("/master/units");
  return unwrap(response.data);
};

export const createUnit = async (payload: { name: string; symbol: string; type: string }) => {
  const response = await api.post<ApiResponse<unknown>>("/master/units", payload);
  return unwrap(response.data);
};

export const updateUnit = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch<ApiResponse<unknown>>(`/master/units/${id}`, payload);
  return unwrap(response.data);
};

export const fetchSeasons = async () => {
  const response = await api.get<ApiResponse<unknown[]>>("/master/seasons");
  return unwrap(response.data);
};

export const createSeason = async (payload: {
  name: string;
  start_month: number;
  end_month: number;
  active: boolean;
}) => {
  const response = await api.post<ApiResponse<unknown>>("/master/seasons", payload);
  return unwrap(response.data);
};

export const updateSeason = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch<ApiResponse<unknown>>(`/master/seasons/${id}`, payload);
  return unwrap(response.data);
};

export const fetchMspRates = async (params?: { commodity_id?: string; season?: string }) => {
  const response = await api.get<ApiResponse<unknown[]>>("/master/msp", { params });
  return unwrap(response.data);
};

export const createMspRate = async (payload: {
  commodity_id: string;
  variety_id?: string;
  season: string;
  price_per_quintal: number;
  source?: string;
  effective_from?: string;
}) => {
  const response = await api.post<ApiResponse<unknown>>("/master/msp", payload);
  return unwrap(response.data);
};

export const updateMspRate = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch<ApiResponse<unknown>>(`/master/msp/${id}`, payload);
  return unwrap(response.data);
};
