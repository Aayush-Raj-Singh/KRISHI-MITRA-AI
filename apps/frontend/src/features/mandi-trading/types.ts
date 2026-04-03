export type TradingTimeframe = 1 | 7 | 30;

export interface MandiTradingFilters {
  crop: string;
  state: string;
  mandi: string;
  timeframe: TradingTimeframe;
}

export interface MandiTradingPoint {
  crop: string;
  mandi: string;
  state: string;
  price: number;
  timestamp: string;
}

export interface RealtimeMandiEvent extends MandiTradingPoint {
  eventType?: string;
}

export interface MandiTradingSummary {
  currentPrice: number;
  previousPrice: number;
  changePct: number;
  highPrice: number;
  lowPrice: number;
  lastUpdated: string;
}

export interface MandiMover {
  crop: string;
  mandi: string;
  state: string;
  currentPrice: number;
  previousPrice: number;
  changePct: number;
  timestamp: string;
}

export interface MandiTradingSnapshot {
  history: MandiTradingPoint[];
  summary: MandiTradingSummary | null;
  gainers: MandiMover[];
  losers: MandiMover[];
  staleDataWarning?: string | null;
  updatedAt: string;
  source: string;
  isCached: boolean;
  offline: boolean;
}

export type LiveTransportMode = "websocket" | "polling";
