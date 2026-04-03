from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.state_engine import StateIntelligenceResponse


class PlatformDataSource(BaseModel):
    id: str
    name: str
    provider: str
    kind: str
    access_mode: str
    freshness: str
    geographic_granularity: str
    url: str
    tags: List[str] = Field(default_factory=list)


class PlatformPersona(BaseModel):
    id: Literal["farmer", "fpo", "agri_business", "government_agency"]
    name: str
    summary: str
    capabilities: List[str] = Field(default_factory=list)
    default_tabs: List[str] = Field(default_factory=list)


class PlatformSubscriptionTier(BaseModel):
    id: Literal["free", "pro", "enterprise"]
    name: str
    target_personas: List[str] = Field(default_factory=list)
    monthly_price_inr: int
    features: List[str] = Field(default_factory=list)


class PublicApiProduct(BaseModel):
    id: str
    name: str
    base_path: str
    description: str
    audience: List[str] = Field(default_factory=list)


class PlatformMicroservice(BaseModel):
    id: str
    name: str
    runtime: str
    responsibility: str


class PipelineJob(BaseModel):
    id: str
    schedule: str
    mode: str
    purpose: str


class HierarchyNode(BaseModel):
    country: str = "India"
    state: Optional[str] = None
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    postal_code: Optional[str] = None
    label: str
    source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PersonaAction(BaseModel):
    title: str
    summary: str
    action_url: Optional[str] = None


class PlatformWorkspaceResponse(BaseModel):
    generated_at: datetime
    persona: PlatformPersona
    hierarchy: HierarchyNode
    intelligence: StateIntelligenceResponse
    actions: List[PersonaAction] = Field(default_factory=list)


class PlatformBlueprintResponse(BaseModel):
    generated_at: datetime
    data_sources: List[PlatformDataSource] = Field(default_factory=list)
    personas: List[PlatformPersona] = Field(default_factory=list)
    subscriptions: List[PlatformSubscriptionTier] = Field(default_factory=list)
    public_apis: List[PublicApiProduct] = Field(default_factory=list)
    microservices: List[PlatformMicroservice] = Field(default_factory=list)
    pipeline_jobs: List[PipelineJob] = Field(default_factory=list)
