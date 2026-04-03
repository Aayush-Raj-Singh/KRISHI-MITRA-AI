import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LanguageIcon from "@mui/icons-material/Language";
import MapIcon from "@mui/icons-material/Map";
import SchemaIcon from "@mui/icons-material/Schema";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  PlatformBlueprintResponse,
  PlatformWorkspaceResponse,
  StateCatalogItem,
  StateCatalogResponse,
  StateIntelligenceResponse,
} from "@krishimitra/shared";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { useLocationContext } from "../context/LocationContext";
import { fetchStateCatalog, fetchStateIntelligence } from "../services/stateEngine";
import { fetchPlatformBlueprint, fetchPlatformWorkspace } from "../services/platform";
import { useAppSelector } from "../store/hooks";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

const tabs = ["dashboard", "advisor", "market", "schemes", "weather", "farm"] as const;
type TabId = (typeof tabs)[number];

const findState = (text: string | undefined, states: StateCatalogItem[]) =>
  states.find((item) =>
    String(text || "")
      .toLowerCase()
      .includes(item.name.toLowerCase()),
  )?.name;
const fmtPrice = (value?: number | null) =>
  value === undefined || value === null
    ? "NA"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value);
const roleToPersona = (role: string | undefined) => {
  if (role === "fpo" || role === "agri_business" || role === "government_agency") return role;
  if (role === "admin" || role === "extension_officer") return "government_agency";
  return "farmer";
};

const Tile: React.FC<{ label: string; value: string; tone: string }> = ({ label, value, tone }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2,
      borderRadius: 3,
      border: `1px solid ${alpha(tone, 0.16)}`,
      bgcolor: alpha("#fff", 0.9),
    }}
  >
    <Typography variant="caption" sx={{ color: tone, fontWeight: 800 }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ mt: 0.7, fontWeight: 800 }}>
      {value}
    </Typography>
  </Paper>
);

const ExternalCard: React.FC<{ title: string; body: string; href: string }> = ({
  title,
  body,
  href,
}) => (
  <Paper
    elevation={0}
    sx={{ p: 2, borderRadius: 3, border: "1px solid rgba(31,84,50,0.12)", height: "100%" }}
  >
    <Stack spacing={1.1} sx={{ height: "100%" }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
        {body}
      </Typography>
      <Box sx={{ mt: "auto" }}>
        <Button
          component="a"
          href={href}
          target="_blank"
          rel="noreferrer"
          size="small"
          sx={{ px: 0 }}
        >
          Open official source
        </Button>
      </Box>
    </Stack>
  </Paper>
);

const NationalAgricultureIntelligencePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector((state) => state.auth.user);
  const {
    state: gpsState,
    city: gpsDistrict,
    label: gpsLabel,
    coords,
    requestLocation,
    status: locationStatus,
  } = useLocationContext();
  const copy = useTranslatedStrings(
    useMemo(
      () => ({
        subtitle:
          "A pan-India agriculture intelligence shell that adapts mandi, weather, schemes, and AI context to the farmer's state and district.",
        workspaceTitle: "National agriculture workspace",
        workspaceSubtitle:
          "Drive state-specific decisions from one service layer instead of jumping between isolated portals.",
        refresh: "Refresh",
        useGps: "Use GPS",
      }),
      [],
    ),
  );

  const queryTab = (searchParams.get("tab") || "dashboard").toLowerCase();
  const [activeTab, setActiveTab] = useState<TabId>(
    tabs.includes(queryTab as TabId) ? (queryTab as TabId) : "dashboard",
  );
  const [catalog, setCatalog] = useState<StateCatalogResponse | null>(null);
  const [blueprint, setBlueprint] = useState<PlatformBlueprintResponse | null>(null);
  const [workspace, setWorkspace] = useState<PlatformWorkspaceResponse | null>(null);
  const [intelligence, setIntelligence] = useState<StateIntelligenceResponse | null>(null);
  const [selectedPersona, setSelectedPersona] = useState(roleToPersona(user?.role));
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingCatalog(true);
    void fetchStateCatalog()
      .then((response) => setCatalog(response))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Unable to load state catalog."),
      )
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    void fetchPlatformBlueprint()
      .then(setBlueprint)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setSelectedPersona(roleToPersona(user?.role));
  }, [user?.role]);

  useEffect(() => {
    if (!catalog?.states.length || selectedState) return;
    setSelectedState(
      findState(gpsState, catalog.states) ||
        findState(user?.location, catalog.states) ||
        findState(gpsLabel, catalog.states) ||
        catalog.states.find((item) => item.name === "Bihar")?.name ||
        catalog.states[0].name,
    );
  }, [catalog?.states, gpsLabel, gpsState, selectedState, user?.location]);

  useEffect(() => {
    const stateSeed = catalog?.states.find((item) => item.name === selectedState);
    if (stateSeed && !selectedCrop) {
      setSelectedCrop(
        user?.primary_crops.find((item) =>
          stateSeed.focus_crops.some((crop) => crop.toLowerCase() === item.toLowerCase()),
        ) ||
          stateSeed.focus_crops[0] ||
          "",
      );
    }
  }, [catalog?.states, selectedCrop, selectedState, user?.primary_crops]);

  const reload = React.useCallback(() => {
    if (!selectedState) return;
    setLoading(true);
    setError(null);
    void fetchPlatformWorkspace({
      persona: selectedPersona,
      state: selectedState,
      district: selectedDistrict || undefined,
      crop: selectedCrop || undefined,
      lat: coords?.lat,
      lon: coords?.lon,
    })
      .then((response) => {
        setWorkspace(response);
        setIntelligence(response.intelligence);
        if (response.intelligence.location.district && !selectedDistrict) {
          setSelectedDistrict(response.intelligence.location.district);
        }
      })
      .catch(() =>
        fetchStateIntelligence({
          state: selectedState,
          district: selectedDistrict || undefined,
          crop: selectedCrop || undefined,
          lat: coords?.lat,
          lon: coords?.lon,
        })
          .then((response) => {
            setWorkspace(null);
            setIntelligence(response);
            if (response.location.district && !selectedDistrict)
              setSelectedDistrict(response.location.district);
          })
          .catch((err) =>
            setError(err instanceof Error ? err.message : "Unable to load state intelligence."),
          ),
      )
      .finally(() => setLoading(false));
  }, [coords?.lat, coords?.lon, selectedCrop, selectedDistrict, selectedPersona, selectedState]);

  useEffect(() => {
    if (selectedState) reload();
  }, [reload, selectedState]);

  const stateSeed = catalog?.states.find((item) => item.name === selectedState);
  const cropOptions = intelligence?.crops.length
    ? intelligence.crops
    : stateSeed?.focus_crops || [];
  const currentTabs = intelligence?.tabs?.length
    ? intelligence.tabs
    : tabs.map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1), badge: null }));
  const languageNames = intelligence?.location.state.primary_languages
    .map((code) => t(`languages.${code}`, { defaultValue: code.toUpperCase() }))
    .join(", ");
  const personaOptions = blueprint?.personas || [
    { id: "farmer", name: "Farmer" },
    { id: "fpo", name: "FPO" },
    { id: "agri_business", name: "Agri Business" },
    { id: "government_agency", name: "Government Agency" },
  ];

  const section = useMemo(() => {
    if (!intelligence) return null;
    if (activeTab === "dashboard") {
      return (
        <Stack spacing={2.2}>
          {workspace ? (
            <Paper sx={{ p: 2.2, borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Persona workspace
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {workspace.persona.name}: {workspace.persona.summary}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {workspace.persona.capabilities.map((item) => (
                    <Chip
                      key={item}
                      size="small"
                      label={item.replace(/_/g, " ")}
                      sx={{ borderRadius: 999 }}
                    />
                  ))}
                </Stack>
              </Stack>
            </Paper>
          ) : null}
          <Grid container spacing={2.2}>
            {[
              ["State coverage", intelligence.location.state.name, "#1f6d45"],
              ["Districts indexed", String(intelligence.districts.length), "#8f4c1a"],
              ["Mandis tracked", String(intelligence.mandis.length), "#2f7c88"],
              ["Sources", String(intelligence.official_sources.length), "#6b4d9b"],
            ].map(([label, value, tone]) => (
              <Grid item xs={12} sm={6} lg={3} key={String(label)}>
                <Tile label={String(label)} value={String(value)} tone={String(tone)} />
              </Grid>
            ))}
          </Grid>
          {intelligence.alerts.map((item) => (
            <Alert
              key={`${item.title}-${item.summary}`}
              severity={item.severity === "critical" ? "error" : item.severity}
            >
              {item.title}: {item.summary}
            </Alert>
          ))}
          <Grid container spacing={2.2}>
            {(workspace?.actions.length ? workspace.actions : intelligence.recommendations).map(
              (item, index) => (
                <Grid item xs={12} md={6} key={`${item.title}-${index}`}>
                  <ExternalCard
                    title={item.title}
                    body={item.summary}
                    href={item.action_url || "/advisory"}
                  />
                </Grid>
              ),
            )}
          </Grid>
          {blueprint ? (
            <Grid container spacing={2.2}>
              {blueprint.public_apis.slice(0, 3).map((item) => (
                <Grid item xs={12} md={4} key={item.id}>
                  <ExternalCard title={item.name} body={item.description} href={item.base_path} />
                </Grid>
              ))}
            </Grid>
          ) : null}
        </Stack>
      );
    }
    if (activeTab === "advisor") {
      return (
        <Grid container spacing={2.2}>
          <Grid item xs={12} md={5}>
            <ExternalCard
              title="AI advisory context"
              body={`Location ${intelligence.location.label}. Crop ${selectedCrop || intelligence.market?.crop || "not set"}. Weather ${intelligence.weather?.source || "pending"}.`}
              href="/advisory"
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <ExternalCard
              title="Advisor launch"
              body="Open the advisory workspace with state, district, crop, weather, and mandi signals already aligned to the current context."
              href="/advisory"
            />
          </Grid>
        </Grid>
      );
    }
    if (activeTab === "market") {
      return (
        <Stack spacing={2.2}>
          <Paper sx={{ p: 2.2, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Live mandi signal
            </Typography>
            {intelligence.market ? (
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {intelligence.market.crop} · {intelligence.market.market}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {fmtPrice(intelligence.market.current_price)}
                </Typography>
                <Chip
                  label={`${intelligence.market.change_percent ?? 0}%`}
                  color={Number(intelligence.market.change_percent || 0) >= 0 ? "success" : "error"}
                  sx={{ width: "fit-content", borderRadius: 999 }}
                />
                {intelligence.market.stale_data_warning ? (
                  <Alert severity="warning">{intelligence.market.stale_data_warning}</Alert>
                ) : null}
              </Stack>
            ) : (
              <Alert severity="info">
                Live mandi signal is not available yet for this state context.
              </Alert>
            )}
          </Paper>
          <Grid container spacing={2.2}>
            {intelligence.mandis.map((item) => (
              <Grid item xs={12} md={6} xl={4} key={`${item.name}-${item.district || "state"}`}>
                <ExternalCard
                  title={item.name}
                  body={`${item.district || intelligence.location.state.name}. ${item.record_count} records. ${item.commodities.join(", ") || "No commodity list yet."}`}
                  href="/services/market-intelligence?tab=price"
                />
              </Grid>
            ))}
          </Grid>
        </Stack>
      );
    }
    if (activeTab === "schemes") {
      return (
        <Grid container spacing={2.2}>
          {intelligence.schemes.map((item) => (
            <Grid item xs={12} md={6} xl={3} key={item.id}>
              <ExternalCard title={item.title} body={item.description} href={item.url} />
            </Grid>
          ))}
        </Grid>
      );
    }
    if (activeTab === "weather") {
      return intelligence.weather ? (
        <Grid container spacing={2.2}>
          {intelligence.weather.forecast.map((day) => (
            <Grid item xs={12} sm={6} md={4} xl={2.4} key={day.date}>
              <ExternalCard
                title={day.date}
                body={`Temperature ${day.temperature_c} C. Rainfall ${day.rainfall_mm} mm.`}
                href="https://mausam.imd.gov.in/responsive/agromet/home.php"
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info">Weather advisory is not available yet for this state context.</Alert>
      );
    }
    return (
      <Grid container spacing={2.2}>
        <Grid item xs={12} md={5}>
          <ExternalCard
            title="State profile"
            body={`${intelligence.location.state.name}. Capital ${intelligence.location.state.capital}. Languages ${languageNames || "pending"}.`}
            href={intelligence.location.state.official_portal_url}
          />
        </Grid>
        <Grid item xs={12} md={7}>
          <ExternalCard
            title="Farmer operating lane"
            body={`Profile location ${user?.location || intelligence.location.label}. Focus crops ${intelligence.location.state.focus_crops.join(", ")}.`}
            href="/profile"
          />
        </Grid>
      </Grid>
    );
  }, [activeTab, blueprint, intelligence, languageNames, selectedCrop, user?.location, workspace]);

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<SchemaIcon color="primary" />}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("services_page.national_agriculture_intelligence", {
            defaultValue: "National Agriculture Intelligence",
          })}
          subtitle={copy.subtitle}
          badges={["State-aware engine", "Mandi + weather fusion", "Scheme routing", "AI context"]}
          imageSrc="/assets/agri-slider/slide-09.jpg"
        />
        <Grid container spacing={2.2}>
          <Grid item xs={12} md={4}>
            <Tile
              label="States and UTs"
              value={loadingCatalog ? "..." : String(catalog?.states.length || 0)}
              tone="#1f6d45"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Tile
              label="Official sources"
              value={
                loadingCatalog
                  ? "..."
                  : String(blueprint?.data_sources.length || catalog?.sources.length || 0)
              }
              tone="#8f4c1a"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Tile
              label="Live context"
              value={
                intelligence?.location.label || gpsLabel || user?.location || "Awaiting selection"
              }
              tone="#2f7c88"
            />
          </Grid>
        </Grid>
        <Paper
          sx={{
            p: { xs: 1.5, md: 2 },
            borderRadius: 3,
            border: "1px solid rgba(31,84,50,0.12)",
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
          }}
        >
          <Stack spacing={1.8}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {copy.workspaceTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.workspaceSubtitle}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  icon={<MapIcon />}
                  label={
                    gpsState
                      ? `GPS ${gpsState}`
                      : locationStatus === "ready"
                        ? gpsLabel || "GPS ready"
                        : "GPS optional"
                  }
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                />
                <Chip
                  icon={<LanguageIcon />}
                  label={languageNames || "Languages"}
                  sx={{ borderRadius: 999, fontWeight: 700 }}
                />
              </Stack>
            </Stack>
            <Grid container spacing={1.4}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Persona"
                  value={selectedPersona}
                  onChange={(event) => setSelectedPersona(event.target.value)}
                >
                  {personaOptions.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="State / UT"
                  value={selectedState}
                  onChange={(event) => {
                    setSelectedState(event.target.value);
                    setSelectedDistrict("");
                  }}
                >
                  {(catalog?.states || []).map((item) => (
                    <MenuItem key={item.code} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="District"
                  value={selectedDistrict}
                  onChange={(event) => setSelectedDistrict(event.target.value)}
                >
                  <MenuItem value="">All districts</MenuItem>
                  {(intelligence?.districts || []).map((item) => (
                    <MenuItem key={item.name} value={item.name}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Crop"
                  value={selectedCrop}
                  onChange={(event) => setSelectedCrop(event.target.value)}
                >
                  {cropOptions.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={12}>
                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="contained" onClick={reload} sx={{ borderRadius: 2.2 }}>
                    {copy.refresh}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      requestLocation();
                      if (gpsState) setSelectedState(gpsState);
                      if (gpsDistrict) setSelectedDistrict(gpsDistrict);
                    }}
                    sx={{ borderRadius: 2.2 }}
                  >
                    {copy.useGps}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
            <Tabs
              value={activeTab}
              onChange={(_event, value) => {
                setActiveTab(value as TabId);
                setSearchParams({ tab: value });
              }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {currentTabs.map((item) => (
                <Tab
                  key={item.id}
                  value={item.id}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{item.label}</span>
                      {item.badge ? (
                        <Chip size="small" label={item.badge} sx={{ borderRadius: 999 }} />
                      ) : null}
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Stack>
        </Paper>
        {error ? <Alert severity="warning">{error}</Alert> : null}
        {loading ? (
          <Grid container spacing={2.2}>
            {[0, 1, 2].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Paper sx={{ p: 2.2, borderRadius: 3 }}>
                  <Skeleton variant="text" width="40%" height={28} />
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="rounded" height={110} sx={{ mt: 1.5 }} />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          section
        )}
        {!loading && intelligence ? (
          <Grid container spacing={2.2}>
            {intelligence.official_sources.slice(0, 6).map((source) => (
              <Grid item xs={12} md={6} xl={4} key={source.id}>
                <ExternalCard title={source.name} body={source.description} href={source.url} />
              </Grid>
            ))}
          </Grid>
        ) : null}
        {!loading && intelligence ? (
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => navigate("/advisory")}
            >
              Open AI Advisor
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/services/market-intelligence?tab=price")}
            >
              Open Mandi Market
            </Button>
            <Button variant="outlined" onClick={() => navigate("/profile")}>
              Open Profile
            </Button>
          </Stack>
        ) : null}
      </Stack>
    </AppLayout>
  );
};

export default NationalAgricultureIntelligencePage;
