import type { StateIntelligenceResponse } from "./stateEngine";

export interface PlatformDataSource {
  id: string;
  name: string;
  provider: string;
  kind: string;
  access_mode: string;
  freshness: string;
  geographic_granularity: string;
  url: string;
  tags: string[];
}

export interface PlatformPersona {
  id: "farmer" | "fpo" | "agri_business" | "government_agency";
  name: string;
  summary: string;
  capabilities: string[];
  default_tabs: string[];
}

export interface PlatformSubscriptionTier {
  id: "free" | "pro" | "enterprise";
  name: string;
  target_personas: string[];
  monthly_price_inr: number;
  features: string[];
}

export interface PublicApiProduct {
  id: string;
  name: string;
  base_path: string;
  description: string;
  audience: string[];
}

export interface PlatformMicroservice {
  id: string;
  name: string;
  runtime: string;
  responsibility: string;
}

export interface PipelineJob {
  id: string;
  schedule: string;
  mode: string;
  purpose: string;
}

export interface HierarchyNode {
  country: string;
  state?: string | null;
  district?: string | null;
  block?: string | null;
  village?: string | null;
  label: string;
  source: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface PersonaAction {
  title: string;
  summary: string;
  action_url?: string | null;
}

export interface PlatformWorkspaceResponse {
  generated_at: string;
  persona: PlatformPersona;
  hierarchy: HierarchyNode;
  intelligence: StateIntelligenceResponse;
  actions: PersonaAction[];
}

export interface PlatformBlueprintResponse {
  generated_at: string;
  data_sources: PlatformDataSource[];
  personas: PlatformPersona[];
  subscriptions: PlatformSubscriptionTier[];
  public_apis: PublicApiProduct[];
  microservices: PlatformMicroservice[];
  pipeline_jobs: PipelineJob[];
}

export interface PlatformWorkspaceFilters {
  persona?: string;
  state?: string;
  district?: string;
  crop?: string;
  lat?: number;
  lon?: number;
}
