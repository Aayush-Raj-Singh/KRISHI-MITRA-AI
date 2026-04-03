export interface OfficialSourceSummary {
  id: string;
  name: string;
  category: string;
  url: string;
  coverage: string;
  update_mode: string;
  data_domains: string[];
  description: string;
  features: string[];
}

export interface StateSeedSummary {
  code: string;
  name: string;
  type: "state" | "ut";
  capital: string;
  region: string;
  official_portal_url: string;
  agriculture_directory_url: string;
  primary_languages: string[];
  focus_crops: string[];
}

export interface StateCatalogItem extends StateSeedSummary {
  district_count: number;
  mandi_count: number;
  crop_count: number;
  source_count: number;
}

export interface StateCatalogResponse {
  generated_at: string;
  states: StateCatalogItem[];
  sources: OfficialSourceSummary[];
}

export interface StateResolutionResponse {
  state: StateSeedSummary;
  district?: string | null;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  source: string;
  inferred_from_gps: boolean;
}

export interface DistrictSummary {
  name: string;
  mandi_count: number;
  crop_count: number;
}

export interface MandiSummary {
  name: string;
  district?: string | null;
  commodity_count: number;
  commodities: string[];
  record_count: number;
  last_observed_at?: string | null;
}

export interface SchemeSummary {
  id: string;
  title: string;
  category: string;
  description: string;
  url: string;
  scope: "national" | "state";
}

export interface StateWeatherDay {
  date: string;
  rainfall_mm: number;
  temperature_c: number;
}

export interface WeatherInsight {
  location: string;
  source: string;
  cached: boolean;
  stale_data_warning?: string | null;
  forecast: StateWeatherDay[];
}

export interface MandiPricePoint {
  date: string;
  price: number;
}

export interface MarketSignal {
  crop: string;
  market: string;
  source: string;
  fetched_at: string;
  cached: boolean;
  stale_data_warning?: string | null;
  current_price?: number | null;
  previous_price?: number | null;
  change_percent?: number | null;
  prices: MandiPricePoint[];
}

export interface StateAlert {
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  source_id?: string | null;
}

export interface SmartRecommendation {
  type: "mandi" | "weather" | "scheme" | "ai";
  title: string;
  summary: string;
  action_label?: string | null;
  action_url?: string | null;
}

export interface StateUiTab {
  id: "dashboard" | "advisor" | "market" | "schemes" | "weather" | "farm";
  label: string;
  badge?: string | null;
}

export interface StateIntelligenceResponse {
  generated_at: string;
  location: StateResolutionResponse;
  districts: DistrictSummary[];
  mandis: MandiSummary[];
  crops: string[];
  official_sources: OfficialSourceSummary[];
  schemes: SchemeSummary[];
  weather?: WeatherInsight | null;
  market?: MarketSignal | null;
  alerts: StateAlert[];
  recommendations: SmartRecommendation[];
  tabs: StateUiTab[];
}

export interface StateResolveFilters {
  state?: string;
  district?: string;
  lat?: number;
  lon?: number;
}

export interface StateIntelligenceFilters extends StateResolveFilters {
  crop?: string;
}
