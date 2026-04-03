from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.integrations import MandiPricePoint
from app.schemas.recommendations import WeatherDay


class OfficialSourceSummary(BaseModel):
    id: str
    name: str
    category: str
    url: str
    coverage: str
    update_mode: str
    data_domains: List[str] = Field(default_factory=list)
    description: str
    features: List[str] = Field(default_factory=list)


class StateSeedSummary(BaseModel):
    code: str
    name: str
    type: Literal["state", "ut"]
    capital: str
    region: str
    official_portal_url: str
    agriculture_directory_url: str
    primary_languages: List[str] = Field(default_factory=list)
    focus_crops: List[str] = Field(default_factory=list)


class StateCatalogItem(StateSeedSummary):
    district_count: int = 0
    mandi_count: int = 0
    crop_count: int = 0
    source_count: int = 0


class StateCatalogResponse(BaseModel):
    generated_at: datetime
    states: List[StateCatalogItem] = Field(default_factory=list)
    sources: List[OfficialSourceSummary] = Field(default_factory=list)


class StateResolutionResponse(BaseModel):
    state: StateSeedSummary
    district: Optional[str] = None
    block: Optional[str] = None
    village: Optional[str] = None
    postal_code: Optional[str] = None
    label: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    source: str
    inferred_from_gps: bool = False


class DistrictSummary(BaseModel):
    name: str
    mandi_count: int = 0
    crop_count: int = 0


class MandiSummary(BaseModel):
    name: str
    district: Optional[str] = None
    commodity_count: int = 0
    commodities: List[str] = Field(default_factory=list)
    record_count: int = 0
    last_observed_at: Optional[datetime] = None


class SchemeSummary(BaseModel):
    id: str
    title: str
    category: str
    description: str
    url: str
    scope: Literal["national", "state"]


class StatePortalLinkSummary(BaseModel):
    title: str
    url: str
    category: str


class StatePortalNoticeSummary(BaseModel):
    title: str
    url: str


class StatePortalUpdateSummary(BaseModel):
    source_id: str
    name: str
    category: str
    url: str
    discovered_from: str
    status: Literal["live", "degraded", "pending"]
    description: Optional[str] = None
    last_synced_at: Optional[datetime] = None
    notices: List[StatePortalNoticeSummary] = Field(default_factory=list)
    links: List[StatePortalLinkSummary] = Field(default_factory=list)


class WeatherInsight(BaseModel):
    location: str
    source: str
    cached: bool = False
    stale_data_warning: Optional[str] = None
    forecast: List[WeatherDay] = Field(default_factory=list)


class MarketSignal(BaseModel):
    crop: str
    market: str
    source: str
    fetched_at: datetime
    cached: bool = False
    stale_data_warning: Optional[str] = None
    current_price: Optional[float] = None
    previous_price: Optional[float] = None
    change_percent: Optional[float] = None
    prices: List[MandiPricePoint] = Field(default_factory=list)


class StateAlert(BaseModel):
    severity: Literal["info", "warning", "critical"]
    title: str
    summary: str
    source_id: Optional[str] = None


class SmartRecommendation(BaseModel):
    type: Literal["mandi", "weather", "scheme", "ai"]
    title: str
    summary: str
    action_label: Optional[str] = None
    action_url: Optional[str] = None


class StateUiTab(BaseModel):
    id: Literal["dashboard", "advisor", "market", "schemes", "weather", "farm"]
    label: str
    badge: Optional[str] = None


class StateIntelligenceResponse(BaseModel):
    generated_at: datetime
    location: StateResolutionResponse
    districts: List[DistrictSummary] = Field(default_factory=list)
    mandis: List[MandiSummary] = Field(default_factory=list)
    crops: List[str] = Field(default_factory=list)
    official_sources: List[OfficialSourceSummary] = Field(default_factory=list)
    portal_updates: List[StatePortalUpdateSummary] = Field(default_factory=list)
    schemes: List[SchemeSummary] = Field(default_factory=list)
    weather: Optional[WeatherInsight] = None
    market: Optional[MarketSignal] = None
    alerts: List[StateAlert] = Field(default_factory=list)
    recommendations: List[SmartRecommendation] = Field(default_factory=list)
    tabs: List[StateUiTab] = Field(default_factory=list)
