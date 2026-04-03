import type { PaginatedRequest } from "./common";
import type { PriceArrivalFilters } from "./dashboard";

export interface TrendFilters extends PriceArrivalFilters {}

export interface TrendPoint {
  date: string;
  avg_price: number;
  arrivals_qtl: number;
}

export interface TrendWindow {
  window_days: number;
  points: TrendPoint[];
  change_pct: number;
  average_price: number;
  volatility: number;
}

export interface SeasonalComparisonItem {
  season: string;
  average_price: number;
  average_arrivals_qtl: number;
  count: number;
}

export interface MarketAlert {
  date: string;
  change_pct: number;
  change_abs: number;
  note: string;
}

export interface TrendAnalyticsResponse {
  filters: TrendFilters;
  windows: TrendWindow[];
  seasonal: SeasonalComparisonItem[];
  volatility: number;
  alerts: MarketAlert[];
  generated_at: string;
  cached?: boolean;
}

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

export interface MandiDirectoryFilters extends PaginatedRequest {
  state?: string;
  district?: string;
  mandi?: string;
  commodity?: string;
}

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

export interface TicketListFilters extends PaginatedRequest {
  scope?: string;
  status?: string;
  skip?: number;
}

export interface CreateTicketRequest {
  subject: string;
  body: string;
  category?: string;
}

export interface TicketStatusUpdate {
  status: string;
  assignee?: string;
}
