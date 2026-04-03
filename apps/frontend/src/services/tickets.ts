import api, { ApiResponse, unwrap } from "./api";

export interface TicketMessage {
  sender: string;
  body: string;
  ts: string;
}

export interface Ticket {
  _id: string;
  subject: string;
  body: string;
  category?: string;
  status: string;
  created_by: string;
  assignee?: string;
  messages: TicketMessage[];
  created_at: string;
  updated_at: string;
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
}

export const createTicket = async (payload: {
  subject: string;
  body: string;
  category?: string;
}) => {
  const response = await api.post<ApiResponse<Ticket>>("/tickets", payload);
  return unwrap(response.data);
};

export const fetchTickets = async (params?: {
  scope?: string;
  status?: string;
  limit?: number;
  skip?: number;
}) => {
  const response = await api.get<ApiResponse<TicketListResponse>>("/tickets", { params });
  return unwrap(response.data);
};

export const replyTicket = async (ticketId: string, body: string) => {
  const response = await api.post<ApiResponse<Ticket>>(`/tickets/${ticketId}/reply`, { body });
  return unwrap(response.data);
};

export const updateTicketStatus = async (ticketId: string, status: string, assignee?: string) => {
  const response = await api.post<ApiResponse<Ticket>>(`/tickets/${ticketId}/status`, {
    status,
    assignee,
  });
  return unwrap(response.data);
};
