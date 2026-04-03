from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from app.core.logging import get_logger
from app.data.platform_catalog import (
    DATA_SOURCE_REGISTRY,
    MICROSERVICE_CATALOG,
    PERSONA_REGISTRY,
    PIPELINE_JOB_CATALOG,
    PUBLIC_API_PRODUCTS,
    SUBSCRIPTION_TIERS,
)
from app.schemas.platform import (
    HierarchyNode,
    PersonaAction,
    PipelineJob,
    PlatformBlueprintResponse,
    PlatformDataSource,
    PlatformMicroservice,
    PlatformPersona,
    PlatformSubscriptionTier,
    PlatformWorkspaceResponse,
    PublicApiProduct,
)
from app.services.external_data_service import ExternalDataService
from app.services.geo_hierarchy_service import GeoHierarchyService
from app.services.state_engine_service import StateEngineService

logger = get_logger(__name__)


class PlatformService:
    def __init__(
        self,
        state_engine_service: StateEngineService,
        external_data_service: ExternalDataService,
        geo_hierarchy_service: GeoHierarchyService | None = None,
    ) -> None:
        self._state_engine_service = state_engine_service
        self._external_data_service = external_data_service
        self._geo_hierarchy_service = geo_hierarchy_service or GeoHierarchyService()

    def blueprint(self) -> PlatformBlueprintResponse:
        return PlatformBlueprintResponse(
            generated_at=datetime.now(timezone.utc),
            data_sources=[PlatformDataSource(**item) for item in DATA_SOURCE_REGISTRY],
            personas=[PlatformPersona(**item) for item in PERSONA_REGISTRY],
            subscriptions=[PlatformSubscriptionTier(**item) for item in SUBSCRIPTION_TIERS],
            public_apis=[PublicApiProduct(**item) for item in PUBLIC_API_PRODUCTS],
            microservices=[PlatformMicroservice(**item) for item in MICROSERVICE_CATALOG],
            pipeline_jobs=[PipelineJob(**item) for item in PIPELINE_JOB_CATALOG],
        )

    def _persona(self, persona_id: str) -> PlatformPersona:
        normalized = str(persona_id or "farmer").strip().lower()
        if normalized == "government":
            normalized = "government_agency"
        for item in PERSONA_REGISTRY:
            if item["id"] == normalized:
                return PlatformPersona(**item)
        return PlatformPersona(**PERSONA_REGISTRY[0])

    async def resolve_hierarchy(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> HierarchyNode:
        source = "request"
        resolved_state = state
        resolved_district = district
        resolved_block = None
        resolved_village = None
        resolved_postal_code = None
        label = ", ".join(part for part in [district, state] if part) or "India"
        if lat is not None and lon is not None:
            try:
                place = await self._external_data_service.reverse_geocode(lat, lon)
                resolved_state = resolved_state or place.state
                resolved_district = resolved_district or place.district or place.city
                resolved_block = place.block
                resolved_village = place.village
                resolved_postal_code = place.postal_code
                label = place.label or label
                source = place.source
            except Exception as exc:
                logger.warning(
                    "platform_hierarchy_reverse_geocode_failed",
                    error=str(exc),
                    latitude=lat,
                    longitude=lon,
                )

        hierarchy = await self._geo_hierarchy_service.resolve(
            state=resolved_state,
            district=resolved_district,
            block=resolved_block,
            village=resolved_village,
            postal_code=resolved_postal_code,
            lat=lat,
            lon=lon,
            source=source,
        )
        if not hierarchy.label or hierarchy.label == "India":
            hierarchy.label = (
                label
                if label and label != "India"
                else ", ".join(
                    part
                    for part in [
                        hierarchy.village,
                        hierarchy.block,
                        hierarchy.district,
                        hierarchy.state,
                    ]
                    if part
                )
                or "India"
            )
        return HierarchyNode(
            state=hierarchy.state,
            district=hierarchy.district,
            block=hierarchy.block,
            village=hierarchy.village,
            postal_code=hierarchy.postal_code,
            label=hierarchy.label,
            source=hierarchy.source,
            latitude=lat,
            longitude=lon,
        )

    async def workspace(
        self,
        persona: str,
        state: Optional[str] = None,
        district: Optional[str] = None,
        crop: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> PlatformWorkspaceResponse:
        selected_persona = self._persona(persona)
        intelligence = await self._state_engine_service.intelligence(
            state=state,
            district=district,
            crop=crop,
            lat=lat,
            lon=lon,
        )
        hierarchy = await self.resolve_hierarchy(
            state=intelligence.location.state.name,
            district=intelligence.location.district,
            lat=lat,
            lon=lon,
        )

        actions = [
            PersonaAction(
                title="Open state intelligence",
                summary="Review localized market, weather, schemes, and official sources.",
                action_url="/services/national-intelligence",
            )
        ]
        if selected_persona.id == "farmer":
            actions.extend(
                [
                    PersonaAction(
                        title="Ask AI advisor",
                        summary="Use state, crop, mandi, and weather context in the advisory flow.",
                        action_url="/advisory",
                    ),
                    PersonaAction(
                        title="Check selling signals",
                        summary="Compare mandi conditions before harvest dispatch.",
                        action_url="/services/market-intelligence?tab=price",
                    ),
                ]
            )
        elif selected_persona.id == "fpo":
            actions.extend(
                [
                    PersonaAction(
                        title="Review cluster mandis",
                        summary="Compare district mandi coverage for bulk movement and aggregation.",
                        action_url="/services/market-intelligence?tab=price",
                    ),
                    PersonaAction(
                        title="Check scheme support",
                        summary="Review schemes and state programs relevant to collective operations.",
                        action_url="/services/national-intelligence?tab=schemes",
                    ),
                ]
            )
        elif selected_persona.id == "agri_business":
            actions.extend(
                [
                    PersonaAction(
                        title="Use public APIs",
                        summary="Integrate mandi, weather, and state intelligence feeds into external systems.",
                        action_url="/api/v1/public/api-catalog",
                    ),
                    PersonaAction(
                        title="Monitor market analytics",
                        summary="Use state and district coverage as a supply and demand signal layer.",
                        action_url="/services/market-intelligence",
                    ),
                ]
            )
        else:
            actions.extend(
                [
                    PersonaAction(
                        title="Review district coverage",
                        summary="Use district, mandi, and scheme signals for policy and program operations.",
                        action_url="/services/national-intelligence?tab=dashboard",
                    ),
                    PersonaAction(
                        title="Inspect public API catalog",
                        summary="Access developer-facing feeds for downstream dashboards and integrations.",
                        action_url="/api/v1/public/api-catalog",
                    ),
                ]
            )

        return PlatformWorkspaceResponse(
            generated_at=datetime.now(timezone.utc),
            persona=selected_persona,
            hierarchy=hierarchy,
            intelligence=intelligence,
            actions=actions,
        )
