from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.core.database import Database
from app.core.logging import get_logger
from app.data.india_state_registry import (
    INDIA_STATE_REGISTRY,
    NATIONAL_AGRICULTURE_SOURCES,
    STATE_NAME_ALIASES,
)
from app.schemas.state_engine import (
    DistrictSummary,
    MandiSummary,
    MarketSignal,
    OfficialSourceSummary,
    SchemeSummary,
    SmartRecommendation,
    StateAlert,
    StateCatalogItem,
    StateCatalogResponse,
    StateIntelligenceResponse,
    StateResolutionResponse,
    StateSeedSummary,
    StateUiTab,
    WeatherInsight,
)
from app.services.external_data_service import ExternalDataService
from app.services.geo_hierarchy_service import GeoHierarchyService
from app.services.state_portal_service import StatePortalService

logger = get_logger(__name__)


@dataclass
class _DistrictAggregate:
    name: str
    mandis: set[str] = field(default_factory=set)
    crops: Counter[str] = field(default_factory=Counter)


@dataclass
class _MandiAggregate:
    name: str
    district: Optional[str] = None
    commodities: Counter[str] = field(default_factory=Counter)
    record_count: int = 0
    last_observed_at: Optional[datetime] = None


@dataclass
class _StateAggregate:
    name: str
    districts: Dict[str, _DistrictAggregate] = field(default_factory=dict)
    mandis: Dict[str, _MandiAggregate] = field(default_factory=dict)
    crops: Counter[str] = field(default_factory=Counter)


class StateEngineService:
    def __init__(
        self,
        db: Database,
        external_data_service: ExternalDataService,
        geo_hierarchy_service: Optional[GeoHierarchyService] = None,
        state_portal_service: Optional[StatePortalService] = None,
    ) -> None:
        self._db = db
        self._external_data_service = external_data_service
        self._geo_hierarchy_service = geo_hierarchy_service or GeoHierarchyService(db)
        self._state_portal_service = state_portal_service or StatePortalService(db)
        self._state_seed_map = {
            self._normalize_key(item["name"]): item for item in INDIA_STATE_REGISTRY
        }

    @staticmethod
    def _normalize_key(value: object) -> str:
        text = str(value or "").strip().lower().replace("&", "and")
        return " ".join(text.split())

    def _normalize_state_name(self, value: object) -> Optional[str]:
        key = self._normalize_key(value)
        if not key:
            return None
        alias = STATE_NAME_ALIASES.get(key)
        if alias:
            return alias
        if key in self._state_seed_map:
            return self._state_seed_map[key]["name"]
        return None

    @staticmethod
    def _clean_text(value: object) -> Optional[str]:
        text = str(value or "").strip()
        return text or None

    @staticmethod
    def _coerce_datetime(value: object) -> Optional[datetime]:
        if isinstance(value, datetime):
            return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
        if not value:
            return None
        raw = str(value).strip()
        if not raw:
            return None
        for candidate in (raw, raw.replace("Z", "+00:00")):
            try:
                parsed = datetime.fromisoformat(candidate)
                return parsed if parsed.tzinfo is not None else parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                continue
        try:
            parsed = datetime.strptime(raw[:10], "%Y-%m-%d")
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None

    def _seed_model(self, seed: dict) -> StateSeedSummary:
        return StateSeedSummary(**seed)

    def _state_sources(self, seed: dict) -> List[OfficialSourceSummary]:
        state_name = seed["name"]
        sources = [OfficialSourceSummary(**source) for source in NATIONAL_AGRICULTURE_SOURCES]
        sources.append(
            OfficialSourceSummary(
                id=f"state_portal_{seed['code'].lower()}",
                name=f"{state_name} State Portal",
                category="state_governance",
                url=seed["official_portal_url"],
                coverage=f"{state_name} official government portal",
                update_mode="portal",
                data_domains=["state programs", "official notices", "department links"],
                description=f"Official entry point for {state_name} government services.",
                features=["State notices", "Department links", "Citizen services"],
            )
        )
        sources.append(
            OfficialSourceSummary(
                id=f"state_agriculture_directory_{seed['code'].lower()}",
                name=f"{state_name} Agriculture Department Directory",
                category="state_agriculture",
                url=seed["agriculture_directory_url"],
                coverage=f"{state_name} agriculture department reference",
                update_mode="directory",
                data_domains=["state agriculture", "department access", "scheme references"],
                description=f"Official India.gov directory entry point for {state_name} agriculture departments.",
                features=[
                    "Department discovery",
                    "State agriculture access",
                    "Official source routing",
                ],
            )
        )
        return sources

    async def _build_market_index(self) -> Dict[str, _StateAggregate]:
        profiles = await self._db["market_profiles"].find({}).to_list(length=None)
        entries = await self._db["mandi_entries"].find({}).to_list(length=None)

        market_lookup: Dict[str, tuple[str, Optional[str]]] = {}
        states: Dict[str, _StateAggregate] = {}

        def ensure_state(state_name: str) -> _StateAggregate:
            key = self._normalize_key(state_name)
            aggregate = states.get(key)
            if aggregate is None:
                aggregate = _StateAggregate(name=state_name)
                states[key] = aggregate
            return aggregate

        def ensure_district(state: _StateAggregate, district_name: str) -> _DistrictAggregate:
            key = self._normalize_key(district_name)
            district = state.districts.get(key)
            if district is None:
                district = _DistrictAggregate(name=district_name)
                state.districts[key] = district
            return district

        def ensure_mandi(
            state: _StateAggregate, mandi_name: str, district_name: Optional[str]
        ) -> _MandiAggregate:
            key = self._normalize_key(mandi_name)
            mandi = state.mandis.get(key)
            if mandi is None:
                mandi = _MandiAggregate(name=mandi_name, district=district_name)
                state.mandis[key] = mandi
            elif district_name and not mandi.district:
                mandi.district = district_name
            return mandi

        for doc in profiles:
            state_name = self._normalize_state_name(doc.get("state"))
            mandi_name = self._clean_text(doc.get("name") or doc.get("market"))
            if not state_name or not mandi_name:
                continue
            district_name = self._clean_text(doc.get("district"))
            commodities = doc.get("commodities") or doc.get("major_commodities") or []
            state = ensure_state(state_name)
            mandi = ensure_mandi(state, mandi_name, district_name)
            if district_name:
                district = ensure_district(state, district_name)
                district.mandis.add(mandi_name)
            market_lookup[self._normalize_key(mandi_name)] = (state_name, district_name)
            for commodity in commodities:
                crop_name = self._clean_text(commodity)
                if not crop_name:
                    continue
                state.crops[crop_name] += 1
                mandi.commodities[crop_name] += 1
                if district_name:
                    district.crops[crop_name] += 1

        for doc in entries:
            state_name = self._normalize_state_name(doc.get("state"))
            mandi_name = self._clean_text(doc.get("market"))
            district_name = self._clean_text(doc.get("district"))
            if mandi_name and not state_name:
                state_name, inferred_district = market_lookup.get(
                    self._normalize_key(mandi_name), (None, None)
                )
                district_name = district_name or inferred_district
            if not state_name or not mandi_name:
                continue
            crop_name = self._clean_text(doc.get("commodity"))
            observed_at = self._coerce_datetime(doc.get("arrival_date"))
            state = ensure_state(state_name)
            mandi = ensure_mandi(state, mandi_name, district_name)
            mandi.record_count += 1
            if observed_at and (
                mandi.last_observed_at is None or observed_at > mandi.last_observed_at
            ):
                mandi.last_observed_at = observed_at
            if district_name:
                district = ensure_district(state, district_name)
                district.mandis.add(mandi_name)
            if crop_name:
                state.crops[crop_name] += 1
                mandi.commodities[crop_name] += 1
                if district_name:
                    district.crops[crop_name] += 1

        return states

    def _state_seed(self, state_name: str) -> dict:
        normalized = self._normalize_state_name(state_name)
        if not normalized:
            raise ValueError(f"Unsupported state: {state_name}")
        return self._state_seed_map[self._normalize_key(normalized)]

    def _best_matching_state(
        self,
        requested_state: Optional[str],
        district: Optional[str],
        market_index: Dict[str, _StateAggregate],
    ) -> dict:
        if requested_state:
            normalized = self._normalize_state_name(requested_state)
            if normalized:
                return self._state_seed(normalized)

        district_key = self._normalize_key(district)
        if district_key:
            for state in INDIA_STATE_REGISTRY:
                aggregate = market_index.get(self._normalize_key(state["name"]))
                if aggregate and district_key in aggregate.districts:
                    return state

        ranked = sorted(
            INDIA_STATE_REGISTRY,
            key=lambda item: len(
                market_index.get(
                    self._normalize_key(item["name"]), _StateAggregate(item["name"])
                ).mandis
            ),
            reverse=True,
        )
        return ranked[0]

    def _location_label(self, state_name: str, district: Optional[str]) -> str:
        return ", ".join(part for part in [district, state_name] if part)

    async def catalog(self) -> StateCatalogResponse:
        market_index = await self._build_market_index()
        items: List[StateCatalogItem] = []
        for seed in INDIA_STATE_REGISTRY:
            aggregate = market_index.get(
                self._normalize_key(seed["name"]), _StateAggregate(seed["name"])
            )
            items.append(
                StateCatalogItem(
                    **seed,
                    district_count=len(aggregate.districts),
                    mandi_count=len(aggregate.mandis),
                    crop_count=len(aggregate.crops),
                    source_count=len(self._state_sources(seed)),
                )
            )
        return StateCatalogResponse(
            generated_at=datetime.now(timezone.utc),
            states=items,
            sources=[OfficialSourceSummary(**source) for source in NATIONAL_AGRICULTURE_SOURCES],
        )

    async def resolve_context(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> StateResolutionResponse:
        market_index = await self._build_market_index()
        gps_state = state
        gps_district = district
        gps_block = None
        gps_village = None
        gps_postal_code = None
        label_source = "request"
        inferred_from_gps = False
        if lat is not None and lon is not None:
            try:
                place = await self._external_data_service.reverse_geocode(lat, lon)
                gps_state = gps_state or place.state
                gps_district = gps_district or place.district or place.city
                gps_block = place.block
                gps_village = place.village
                gps_postal_code = place.postal_code
                label_source = place.source
                inferred_from_gps = bool(place.state)
            except Exception as exc:
                logger.warning(
                    "state_engine_reverse_geocode_failed",
                    error=str(exc),
                    latitude=lat,
                    longitude=lon,
                )

        hierarchy = await self._geo_hierarchy_service.resolve(
            state=gps_state,
            district=gps_district,
            block=gps_block,
            village=gps_village,
            postal_code=gps_postal_code,
            lat=lat,
            lon=lon,
            source=label_source,
        )

        seed = self._best_matching_state(
            hierarchy.state or gps_state, hierarchy.district or gps_district, market_index
        )
        resolved_state = seed["name"]
        aggregate = market_index.get(self._normalize_key(resolved_state))
        resolved_district = self._clean_text(hierarchy.district or gps_district)
        resolved_block = self._clean_text(hierarchy.block)
        resolved_village = self._clean_text(hierarchy.village)
        resolved_postal_code = self._clean_text(hierarchy.postal_code)
        if (
            resolved_district
            and aggregate
            and self._normalize_key(resolved_district) not in aggregate.districts
        ):
            resolved_district = None
            resolved_block = None
            resolved_village = None
        if not resolved_district and aggregate and aggregate.districts:
            resolved_district = next(
                iter(sorted((item.name for item in aggregate.districts.values()))), None
            )
            resolved_block = None
            resolved_village = None
        label = ", ".join(
            part
            for part in [resolved_village, resolved_block, resolved_district, resolved_state]
            if part
        )
        if not label:
            label = (
                hierarchy.label
                if hierarchy.label and hierarchy.label != "India"
                else self._location_label(resolved_state, resolved_district)
            )
        return StateResolutionResponse(
            state=self._seed_model(seed),
            district=resolved_district,
            block=resolved_block,
            village=resolved_village,
            postal_code=resolved_postal_code,
            label=label,
            latitude=lat,
            longitude=lon,
            source=hierarchy.source or label_source,
            inferred_from_gps=inferred_from_gps,
        )

    async def intelligence(
        self,
        state: Optional[str] = None,
        district: Optional[str] = None,
        crop: Optional[str] = None,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> StateIntelligenceResponse:
        market_index = await self._build_market_index()
        location = await self.resolve_context(state=state, district=district, lat=lat, lon=lon)
        seed = self._state_seed(location.state.name)
        aggregate = market_index.get(
            self._normalize_key(location.state.name), _StateAggregate(location.state.name)
        )

        district_summaries = sorted(
            [
                DistrictSummary(
                    name=item.name,
                    mandi_count=len(item.mandis),
                    crop_count=len(item.crops),
                )
                for item in aggregate.districts.values()
            ],
            key=lambda item: (-item.mandi_count, item.name),
        )[:12]

        preferred_district_key = self._normalize_key(location.district)
        mandi_candidates = list(aggregate.mandis.values())
        if preferred_district_key:
            filtered = [
                item
                for item in mandi_candidates
                if self._normalize_key(item.district) == preferred_district_key
            ]
            if filtered:
                mandi_candidates = filtered

        mandi_summaries = sorted(
            [
                MandiSummary(
                    name=item.name,
                    district=item.district,
                    commodity_count=len(item.commodities),
                    commodities=[name for name, _ in item.commodities.most_common(6)],
                    record_count=item.record_count,
                    last_observed_at=item.last_observed_at,
                )
                for item in mandi_candidates
            ],
            key=lambda item: (-item.record_count, item.name),
        )[:8]

        crop_candidates = [name for name, _ in aggregate.crops.most_common(12)]
        if not crop_candidates:
            crop_candidates = list(seed["focus_crops"])
        selected_crop = self._clean_text(crop) or (crop_candidates[0] if crop_candidates else None)
        selected_market = mandi_summaries[0].name if mandi_summaries else None

        weather_insight: Optional[WeatherInsight] = None
        location_label = location.label or location.state.name
        try:
            weather = await self._external_data_service.fetch_weather(location_label, days=5)
            weather_insight = WeatherInsight(
                location=weather.location,
                source=weather.source,
                cached=weather.cached,
                stale_data_warning=weather.stale_data_warning,
                forecast=weather.forecast,
            )
        except Exception as exc:
            logger.warning("state_engine_weather_failed", error=str(exc), location=location_label)

        market_signal: Optional[MarketSignal] = None
        if selected_crop and selected_market:
            try:
                market = await self._external_data_service.fetch_mandi_prices(
                    selected_crop, selected_market, days=7
                )
                ordered_prices = sorted(market.prices, key=lambda item: item.date)
                current_price = ordered_prices[-1].price if ordered_prices else None
                previous_price = (
                    ordered_prices[-2].price if len(ordered_prices) >= 2 else current_price
                )
                change_percent = None
                if current_price is not None and previous_price not in (None, 0):
                    change_percent = round(
                        ((current_price - previous_price) / previous_price) * 100, 2
                    )
                market_signal = MarketSignal(
                    crop=selected_crop,
                    market=selected_market,
                    source=market.source,
                    fetched_at=market.fetched_at,
                    cached=market.cached,
                    stale_data_warning=market.stale_data_warning,
                    current_price=current_price,
                    previous_price=previous_price,
                    change_percent=change_percent,
                    prices=ordered_prices,
                )
            except Exception as exc:
                logger.warning(
                    "state_engine_market_failed",
                    error=str(exc),
                    crop=selected_crop,
                    market=selected_market,
                )

        sources = self._state_sources(seed)
        portal_updates = []
        try:
            portal_updates = await self._state_portal_service.sync_state(seed)
        except Exception as exc:
            logger.warning("state_engine_portal_sync_failed", state=seed["name"], error=str(exc))
        schemes = [
            SchemeSummary(
                id="pm_kisan",
                title="PM-KISAN",
                category="income_support",
                description="Farmer income support and beneficiary tracking.",
                url="https://pmkisan.gov.in/",
                scope="national",
            ),
            SchemeSummary(
                id="pmfby",
                title="PMFBY",
                category="insurance",
                description="Crop insurance for climate and production risk coverage.",
                url="https://pmfby.gov.in/",
                scope="national",
            ),
            SchemeSummary(
                id="soil_health_card",
                title="Soil Health Card",
                category="soil",
                description="Soil testing and nutrient management support.",
                url="https://soilhealth.dac.gov.in/",
                scope="national",
            ),
            SchemeSummary(
                id=f"state_agriculture_{seed['code'].lower()}",
                title=f"{seed['name']} agriculture services",
                category="state_service",
                description=f"Official state agriculture department discovery and service access for {seed['name']}.",
                url=seed["agriculture_directory_url"],
                scope="state",
            ),
        ]

        alerts: List[StateAlert] = [
            StateAlert(
                severity="info",
                title=f"{seed['name']} state engine ready",
                summary=(
                    f"State-specific sources, crops, mandi coverage, and local language support are active for {seed['name']}."
                ),
                source_id=f"state_portal_{seed['code'].lower()}",
            )
        ]
        if market_signal and market_signal.stale_data_warning:
            alerts.append(
                StateAlert(
                    severity="warning",
                    title="Live mandi feed degraded",
                    summary=market_signal.stale_data_warning,
                    source_id="agmarknet",
                )
            )
        if (
            market_signal
            and market_signal.change_percent is not None
            and market_signal.change_percent <= -2
        ):
            alerts.append(
                StateAlert(
                    severity="warning",
                    title=f"{market_signal.crop} price under pressure",
                    summary=(
                        f"{market_signal.market} has moved {market_signal.change_percent:.2f}% versus the previous print."
                    ),
                    source_id="agmarknet",
                )
            )
        if weather_insight and any(day.rainfall_mm >= 40 for day in weather_insight.forecast):
            alerts.append(
                StateAlert(
                    severity="warning",
                    title="Heavy rain risk in forecast window",
                    summary="Protect field operations, drainage, and input application schedules.",
                    source_id="meghdoot",
                )
            )
        if weather_insight and any(day.temperature_c >= 38 for day in weather_insight.forecast):
            alerts.append(
                StateAlert(
                    severity="warning",
                    title="High heat signal in forecast window",
                    summary="Review irrigation timing and crop-stress precautions before peak daytime heat.",
                    source_id="meghdoot",
                )
            )
        if portal_updates and any(item.status != "live" for item in portal_updates):
            alerts.append(
                StateAlert(
                    severity="warning",
                    title="Some state portal feeds are stale",
                    summary="Using the latest cached portal snapshots for one or more state sources.",
                    source_id=f"state_portal_{seed['code'].lower()}",
                )
            )

        recommendations: List[SmartRecommendation] = [
            SmartRecommendation(
                type="scheme",
                title="Review scheme eligibility for this state",
                summary="Check PM-KISAN, PMFBY, and state agriculture services with your current state context preselected.",
                action_label="Open schemes",
                action_url="/services/national-intelligence?tab=schemes",
            ),
            SmartRecommendation(
                type="ai",
                title="Use AI advisory with state context",
                summary=(
                    f"Launch the AI advisor with {location.state.name} context, local crops, weather outlook, and mandi signals."
                ),
                action_label="Open advisor",
                action_url="/advisory",
            ),
        ]
        if (
            market_signal
            and market_signal.change_percent is not None
            and market_signal.change_percent < 0
        ):
            recommendations.insert(
                0,
                SmartRecommendation(
                    type="mandi",
                    title="Compare alternate mandis before selling",
                    summary=(
                        f"{market_signal.crop} is softer in {market_signal.market}. Compare nearby mandis in "
                        f"{location.state.name} before finalizing a sale."
                    ),
                    action_label="Open mandi market",
                    action_url="/services/market-intelligence?tab=price",
                ),
            )
        if weather_insight and any(day.rainfall_mm >= 25 for day in weather_insight.forecast):
            recommendations.insert(
                0,
                SmartRecommendation(
                    type="weather",
                    title="Plan around the rain window",
                    summary="Delay spray and adjust harvest or transport planning around the higher rainfall days.",
                    action_label="Open weather",
                    action_url="/services/national-intelligence?tab=weather",
                ),
            )

        tabs = [
            StateUiTab(id="dashboard", label="Dashboard", badge=location.state.code),
            StateUiTab(id="advisor", label="AI Advisor", badge=selected_crop or None),
            StateUiTab(
                id="market",
                label="Mandi Market",
                badge=str(len(mandi_summaries)) if mandi_summaries else None,
            ),
            StateUiTab(id="schemes", label="Schemes", badge=str(len(schemes))),
            StateUiTab(
                id="weather",
                label="Weather",
                badge=str(len(weather_insight.forecast)) if weather_insight else None,
            ),
            StateUiTab(id="farm", label="My Farm", badge=str(len(seed["primary_languages"]))),
        ]

        return StateIntelligenceResponse(
            generated_at=datetime.now(timezone.utc),
            location=location,
            districts=district_summaries,
            mandis=mandi_summaries,
            crops=crop_candidates,
            official_sources=sources,
            portal_updates=portal_updates,
            schemes=schemes,
            weather=weather_insight,
            market=market_signal,
            alerts=alerts[:8],
            recommendations=recommendations[:6],
            tabs=tabs,
        )
