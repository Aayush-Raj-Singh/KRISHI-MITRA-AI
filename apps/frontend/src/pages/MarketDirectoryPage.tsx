import React, { useMemo, useState } from "react";
import {
  alpha,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CallIcon from "@mui/icons-material/Call";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HubIcon from "@mui/icons-material/Hub";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import AgricultureHero from "../components/common/AgricultureHero";
import { fetchMandiDirectory, type MandiDirectoryFilters } from "../services/mandiDirectory";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

const MarketDirectoryPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const mandiOptions = useMandiFilterOptions();
  const copy = useTranslatedStrings(
    useMemo(
      () => ({
        heroSubtitle:
          "Explore mandi facilities, timings, transport access, and commodity footprint through a directory built like an agricultural operations desk.",
        badgeVerifiedProfiles: "Verified mandi profiles",
        badgeCommodityFiltering: "Commodity-led filtering",
        badgeFacilitiesAndLogistics: "Facilities and logistics view",
        badgeDistrictSearch: "District-ready search",
        statMandisInView: "Mandis in view",
        statStatesCovered: "States covered",
        statCommoditySpread: "Commodity spread",
        filterTitle: "Filter and locate mandis",
        filterSubtitle:
          "Narrow the directory by geography and commodity before opening detailed mandi cards.",
        reset: "Reset",
        timingsNotListed: "Timings not listed",
        transportPending: "Transport details pending",
        facilitiesLabel: "facilities",
        marketDistrict: "Market district",
        keyCommodities: "Key commodities",
        operationalSignal: "Operational signal",
        facilityRichMandi: "Facility-rich mandi",
        basicMandiProfile: "Basic mandi profile",
        profileSignals: "Profile signals",
        contactDesk: "Contact desk",
        phoneNotListed: "Phone not listed",
        emailNotListed: "Email not listed",
        facilitiesTitle: "Facilities",
        facilityDataPending: "Facility data pending",
        noPhoneListed: "No phone listed",
      }),
      [],
    ),
  );
  const [filters, setFilters] = useState<MandiDirectoryFilters>({});
  const [applied, setApplied] = useState<MandiDirectoryFilters>({});

  const selectedState = filters.state?.trim() || "";
  const selectedDistrict = filters.district?.trim() || "";
  const districtsForState = selectedState ? mandiOptions.getDistrictsForState(selectedState) : [];
  const mandisForDistrict =
    selectedState && selectedDistrict
      ? mandiOptions.getMandisForDistrict(selectedState, selectedDistrict)
      : [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["mandi-directory", applied],
    queryFn: () => fetchMandiDirectory(applied),
  });

  const handleFilterChange = (key: keyof MandiDirectoryFilters, value: string) => {
    const nextValue = value.trim();
    setFilters((prev) => {
      const next: MandiDirectoryFilters = { ...prev, [key]: nextValue ? nextValue : undefined };
      if (key === "state" && (prev.state || "") !== nextValue) {
        next.district = undefined;
        next.mandi = undefined;
      }
      if (key === "district" && (prev.district || "") !== nextValue) {
        next.mandi = undefined;
      }
      return next;
    });
  };

  const handleReset = () => {
    setFilters({});
    setApplied({});
  };

  const filterFields: Array<{
    key: keyof MandiDirectoryFilters;
    label: string;
    options: string[];
    disabled?: boolean;
  }> = [
    {
      label: t("filters.state", { defaultValue: "State" }),
      key: "state",
      options: mandiOptions.states,
    },
    {
      label: t("filters.district", { defaultValue: "District" }),
      key: "district",
      options: districtsForState,
      disabled: !selectedState,
    },
    {
      label: t("filters.mandi", { defaultValue: "Mandi" }),
      key: "mandi",
      options: mandisForDistrict,
      disabled: !selectedState || !selectedDistrict,
    },
    {
      label: t("filters.commodity", { defaultValue: "Commodity" }),
      key: "commodity",
      options: mandiOptions.commodities,
    },
  ];

  const directoryStats = useMemo(() => {
    const items = data || [];
    return {
      resultCount: items.length,
      stateCount: new Set(items.map((item) => item.state)).size,
      commodityCount: new Set(items.flatMap((item) => item.major_commodities || [])).size,
    };
  }, [data]);

  const featuredMandi = data?.[0] ?? null;
  const topCommodityChips = useMemo(() => {
    const frequencies = new Map<string, number>();
    (data || []).forEach((item) => {
      (item.major_commodities || []).forEach((commodity) => {
        const key = commodity.trim();
        if (!key) return;
        frequencies.set(key, (frequencies.get(key) || 0) + 1);
      });
    });
    return [...frequencies.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([commodity, count]) => ({ commodity, count }));
  }, [data]);

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<StorefrontIcon color="primary" />}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("market_directory_page.title", { defaultValue: "Market Profile Explorer" })}
          subtitle={copy.heroSubtitle}
          badges={[
            copy.badgeVerifiedProfiles,
            copy.badgeCommodityFiltering,
            copy.badgeFacilitiesAndLogistics,
            copy.badgeDistrictSearch,
          ]}
          imageSrc="/assets/agri-slider/slide-09.jpg"
        />

        <Grid container spacing={2.2}>
          {[
            { label: copy.statMandisInView, value: directoryStats.resultCount, tone: "#1f6d45" },
            { label: copy.statStatesCovered, value: directoryStats.stateCount, tone: "#8f4c1a" },
            {
              label: copy.statCommoditySpread,
              value: directoryStats.commodityCount,
              tone: "#2f7c88",
            },
          ].map((item) => (
            <Grid item xs={12} md={4} key={item.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${alpha(item.tone, 0.16)}`,
                  bgcolor: isDark ? alpha("#0f2015", 0.72) : alpha("#ffffff", 0.9),
                }}
              >
                <Typography variant="caption" sx={{ color: item.tone, fontWeight: 800 }}>
                  {item.label}
                </Typography>
                <Typography variant="h6" sx={{ mt: 0.7, fontWeight: 800 }}>
                  {item.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper
          sx={{
            p: { xs: 2.25, md: 2.75 },
            borderRadius: 3,
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(31,84,50,0.12)",
            background: isDark
              ? "linear-gradient(145deg, rgba(15,32,21,0.98) 0%, rgba(11,24,17,0.98) 100%)"
              : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {copy.filterTitle}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {copy.filterSubtitle}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={handleReset} sx={{ fontWeight: 700 }}>
                  {copy.reset}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setApplied(filters)}
                  sx={{ fontWeight: 700 }}
                >
                  {t("filters.search", { defaultValue: "Search" })}
                </Button>
              </Stack>
            </Stack>
            <Grid container spacing={2}>
              {filterFields.map((field) => (
                <Grid item xs={12} sm={6} md={3} key={field.key}>
                  <FilterAutocomplete
                    label={field.label}
                    value={(filters as Record<string, string>)[field.key] || ""}
                    options={field.options}
                    disabled={field.disabled}
                    onChange={(value) => handleFilterChange(field.key, value)}
                  />
                </Grid>
              ))}
            </Grid>
            {topCommodityChips.length > 0 && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {topCommodityChips.map((item) => (
                  <Chip
                    key={item.commodity}
                    label={`${item.commodity} (${item.count})`}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, commodity: item.commodity }));
                      setApplied((prev) => ({ ...prev, commodity: item.commodity }));
                    }}
                    clickable
                    sx={{ borderRadius: 999, fontWeight: 700 }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Paper>

        {isLoading && (
          <Alert severity="info">
            {t("market_directory_page.loading", { defaultValue: "Loading mandis..." })}
          </Alert>
        )}
        {error && <Alert severity="error">{t("common.request_failed")}</Alert>}

        {featuredMandi && (
          <Paper
            sx={{
              p: { xs: 2.4, md: 2.8 },
              borderRadius: 3,
              overflow: "hidden",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(31,84,50,0.12)",
              background: isDark
                ? "linear-gradient(145deg, rgba(15,32,21,0.98) 0%, rgba(11,24,17,0.98) 100%)"
                : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
            }}
          >
            <Grid container spacing={3}>
              <Grid item xs={12} lg={7.5}>
                <Stack spacing={1.6}>
                  <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                    <Avatar sx={{ bgcolor: alpha("#1f6d45", 0.14), color: "#1f6d45" }}>
                      <VerifiedIcon />
                    </Avatar>
                    <Box>
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                          fontSize: { xs: "1.8rem", md: "2.2rem" },
                        }}
                      >
                        {featuredMandi.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {featuredMandi.district || "-"}, {featuredMandi.state}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      icon={<AccessTimeIcon />}
                      label={featuredMandi.timings || copy.timingsNotListed}
                      sx={{ borderRadius: 999, fontWeight: 700 }}
                    />
                    <Chip
                      icon={<DirectionsBusIcon />}
                      label={featuredMandi.transport_info || copy.transportPending}
                      sx={{ borderRadius: 999, fontWeight: 700 }}
                    />
                    <Chip
                      icon={<Inventory2Icon />}
                      label={`${featuredMandi.facilities.length} ${copy.facilitiesLabel}`}
                      sx={{ borderRadius: 999, fontWeight: 700 }}
                    />
                  </Stack>

                  <Grid container spacing={1.5}>
                    {[
                      {
                        icon: <PlaceOutlinedIcon />,
                        label: copy.marketDistrict,
                        value: featuredMandi.district || "-",
                      },
                      {
                        icon: <HubIcon />,
                        label: copy.keyCommodities,
                        value: featuredMandi.major_commodities.slice(0, 3).join(", ") || "-",
                      },
                      {
                        icon: <VerifiedIcon />,
                        label: copy.operationalSignal,
                        value:
                          featuredMandi.facilities.length >= 3
                            ? copy.facilityRichMandi
                            : copy.basicMandiProfile,
                      },
                    ].map((item) => (
                      <Grid item xs={12} md={4} key={item.label}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.6,
                            height: "100%",
                            borderRadius: 2.5,
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.08)"
                              : "1px solid rgba(31,84,50,0.1)",
                            bgcolor: isDark ? alpha("#102116", 0.8) : alpha("#ffffff", 0.84),
                          }}
                        >
                          <Stack spacing={0.7}>
                            <Stack
                              direction="row"
                              spacing={0.8}
                              alignItems="center"
                              color="text.secondary"
                            >
                              {item.icon}
                              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                                {item.label}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.value}
                            </Typography>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Stack>
              </Grid>

              <Grid item xs={12} lg={4.5}>
                <Card
                  sx={{
                    height: "100%",
                    borderRadius: 3,
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(31,84,50,0.1)",
                    boxShadow: "none",
                    bgcolor: isDark ? alpha("#102116", 0.84) : alpha("#ffffff", 0.88),
                  }}
                >
                  <CardContent sx={{ p: 2.3 }}>
                    <Stack spacing={1.5}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {copy.profileSignals}
                      </Typography>
                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                        {(featuredMandi.facilities || []).slice(0, 6).map((facility) => (
                          <Chip
                            key={facility}
                            label={facility}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ borderRadius: 999, fontWeight: 700 }}
                          />
                        ))}
                      </Stack>
                      <Divider />
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {copy.contactDesk}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CallIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {featuredMandi.contact?.phone || copy.phoneNotListed}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <EmailOutlinedIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {featuredMandi.contact?.email || copy.emailNotListed}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Grid container spacing={2.2}>
          {(data || []).map((mandi) => (
            <Grid item xs={12} md={6} xl={4} key={mandi.mandi_id}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid rgba(31,84,50,0.12)",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(14,30,21,0.98) 0%, rgba(10,22,16,0.98) 100%)"
                    : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
                  boxShadow: isDark
                    ? "0 18px 28px rgba(0,0,0,0.24)"
                    : "0 18px 28px rgba(18,58,31,0.1)",
                }}
              >
                <CardContent sx={{ p: 2.3, height: "100%" }}>
                  <Stack spacing={1.35} sx={{ height: "100%" }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1.5}>
                      <Stack spacing={0.4}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 800,
                            fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                          }}
                        >
                          {mandi.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {mandi.district || "-"}, {mandi.state}
                        </Typography>
                      </Stack>
                      <Avatar sx={{ bgcolor: alpha("#1f6d45", 0.12), color: "#1f6d45" }}>
                        <StorefrontIcon />
                      </Avatar>
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {(mandi.major_commodities || []).slice(0, 4).map((item) => (
                        <Chip
                          key={item}
                          label={item}
                          size="small"
                          sx={{ borderRadius: 999, fontWeight: 700 }}
                        />
                      ))}
                    </Stack>

                    <Grid container spacing={1.2}>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.3,
                            borderRadius: 2,
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.08)"
                              : "1px solid rgba(31,84,50,0.08)",
                            bgcolor: isDark ? alpha("#102116", 0.78) : alpha("#ffffff", 0.88),
                          }}
                        >
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 700 }}
                              >
                                {t("market_directory_page.timings_label", {
                                  defaultValue: "Timings",
                                })}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {mandi.timings || "-"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.3,
                            borderRadius: 2,
                            border: isDark
                              ? "1px solid rgba(255,255,255,0.08)"
                              : "1px solid rgba(31,84,50,0.08)",
                            bgcolor: isDark ? alpha("#102116", 0.78) : alpha("#ffffff", 0.88),
                          }}
                        >
                          <Stack direction="row" spacing={0.8} alignItems="center">
                            <DirectionsBusIcon fontSize="small" color="action" />
                            <Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontWeight: 700 }}
                              >
                                {t("market_directory_page.transport_label", {
                                  defaultValue: "Transport",
                                })}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {mandi.transport_info || "-"}
                              </Typography>
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    </Grid>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                        {copy.facilitiesTitle}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        flexWrap="wrap"
                        sx={{ mt: 0.8 }}
                      >
                        {(mandi.facilities || []).slice(0, 5).map((facility) => (
                          <Chip
                            key={facility}
                            label={facility}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ borderRadius: 999, fontWeight: 700 }}
                          />
                        ))}
                        {mandi.facilities.length === 0 && (
                          <Chip
                            label={copy.facilityDataPending}
                            size="small"
                            sx={{ borderRadius: 999 }}
                          />
                        )}
                      </Stack>
                    </Box>

                    <Divider />

                    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: "auto" }}>
                      <Chip
                        icon={<CallIcon />}
                        label={mandi.contact?.phone || copy.noPhoneListed}
                        size="small"
                        sx={{ borderRadius: 999, fontWeight: 700 }}
                      />
                      {(mandi.contact?.person || mandi.contact?.email) && (
                        <Chip
                          icon={<VerifiedIcon />}
                          label={mandi.contact?.person || mandi.contact?.email || ""}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 999, fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default MarketDirectoryPage;
