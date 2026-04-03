import { API_ENDPOINTS } from "../constants/endpoints";
import type { ApiEnvelope } from "../contracts/common";
import type {
  CreateTicketRequest,
  MandiDirectoryFilters,
  MandiDirectoryItem,
  MarketAlert,
  Ticket,
  TicketListFilters,
  TicketListResponse,
  TicketStatusUpdate,
  TrendAnalyticsResponse,
  TrendFilters,
} from "../contracts/market";
import type { FeatureApiContext } from "./context";

export const createMarketApi = ({ api, unwrap }: FeatureApiContext) => ({
  getTrendAnalytics: async (filters: TrendFilters): Promise<TrendAnalyticsResponse> => {
    const response = await api.get<ApiEnvelope<TrendAnalyticsResponse>>(
      API_ENDPOINTS.analytics.trends,
      {
        params: filters,
      },
    );
    return unwrap(response.data);
  },
  getMarketAlerts: async (filters?: TrendFilters): Promise<MarketAlert[]> => {
    const response = await api.get<ApiEnvelope<MarketAlert[]>>(API_ENDPOINTS.alerts.market, {
      params: filters,
    });
    return unwrap(response.data);
  },
  getMandiDirectory: async (filters: MandiDirectoryFilters): Promise<MandiDirectoryItem[]> => {
    const response = await api.get<ApiEnvelope<MandiDirectoryItem[]>>(
      API_ENDPOINTS.directory.mandi,
      {
        params: filters,
      },
    );
    return unwrap(response.data);
  },
  getMandiProfile: async (mandiId: string): Promise<MandiDirectoryItem> => {
    const response = await api.get<ApiEnvelope<MandiDirectoryItem>>(
      `${API_ENDPOINTS.directory.mandi}/${encodeURIComponent(mandiId)}`,
    );
    return unwrap(response.data);
  },
});

export const createSupportApi = ({ api, unwrap }: FeatureApiContext) => ({
  getTickets: async (filters?: TicketListFilters): Promise<TicketListResponse> => {
    const response = await api.get<ApiEnvelope<TicketListResponse>>(API_ENDPOINTS.support.tickets, {
      params: filters,
    });
    return unwrap(response.data);
  },
  createTicket: async (payload: CreateTicketRequest): Promise<Ticket> => {
    const response = await api.post<ApiEnvelope<Ticket>>(API_ENDPOINTS.support.tickets, payload);
    return unwrap(response.data);
  },
  replyTicket: async (ticketId: string, body: string): Promise<Ticket> => {
    const response = await api.post<ApiEnvelope<Ticket>>(
      `${API_ENDPOINTS.support.tickets}/${encodeURIComponent(ticketId)}/reply`,
      { body },
    );
    return unwrap(response.data);
  },
  updateTicketStatus: async (ticketId: string, payload: TicketStatusUpdate): Promise<Ticket> => {
    const response = await api.post<ApiEnvelope<Ticket>>(
      `${API_ENDPOINTS.support.tickets}/${encodeURIComponent(ticketId)}/status`,
      payload,
    );
    return unwrap(response.data);
  },
});
