import React, { useMemo } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BugReportIcon from "@mui/icons-material/BugReport";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HubIcon from "@mui/icons-material/Hub";
import InsightsIcon from "@mui/icons-material/Insights";
import LayersIcon from "@mui/icons-material/Layers";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { useAppSelector } from "../store/hooks";
import { useTranslatedStrings } from "../utils/useTranslatedStrings";

type PortalModule = {
  title: string;
  path: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  signal: string;
  tags: string[];
};

const PortalPage: React.FC = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const role = user?.role || "farmer";
  const roleLabel =
    role === "admin"
      ? t("layout.role_admin", { defaultValue: "Admin" })
      : role === "extension_officer"
        ? t("auth.role_extension_officer", { defaultValue: "Extension Officer" })
        : t("auth.role_farmer", { defaultValue: "Farmer" });
  const copy = useTranslatedStrings(
    useMemo(
      () => ({
        controlLayer: "Control layer",
        liveAnalytics: "Live analytics",
        fieldHealth: "Field health",
        governance: "Governance",
        qualityWatch: "Quality watch",
        farmerWorkflow: "Farmer workflow",
        marketAccess: "Market access",
        arrivalWatch: "Arrival watch",
        healthAlert: "Health alert",
        fieldPlanning: "Field planning",
        priceRadar: "Price radar",
        seasonPlan: "Season plan",
        plantHealth: "Plant health",
        nearestMandi: "Nearest mandi",
        supportLane: "Support lane",
        records: "Records",
        sync: "Sync",
        quality: "Quality",
        trends: "Trends",
        arrivals: "Arrivals",
        alerts: "Alerts",
        visionAi: "Vision AI",
        cases: "Cases",
        treatment: "Treatment",
        audit: "Audit",
        security: "Security",
        ops: "Ops",
        validation: "Validation",
        coverage: "Coverage",
        confidence: "Confidence",
        outreach: "Outreach",
        response: "Response",
        escalation: "Escalation",
        facilities: "Facilities",
        contacts: "Contacts",
        distance: "Distance",
        mandis: "Mandis",
        signals: "Signals",
        dispatch: "Dispatch",
        diagnosis: "Diagnosis",
        images: "Images",
        crop: "Crop",
        water: "Water",
        season: "Season",
        prices: "Prices",
        markets: "Markets",
        schedule: "Schedule",
        directory: "Directory",
        tickets: "Tickets",
        help: "Help",
        resolution: "Resolution",
        adminMasterDataDescription:
          "Govern crop, mandi, and program master records for downstream services.",
        marketIntelligenceDescription:
          "Monitor arrivals, price patterns, and mandi-wide signals before interventions.",
        diseaseReliabilityDescription:
          "Review disease workflow coverage and treatment recommendation reliability.",
        auditLogsDescription:
          "Inspect operational traces, role actions, and compliance-sensitive events.",
        dataQualityDescription: "Track validation gaps and keep agricultural decision data clean.",
        officerWorkflowDescription:
          "Move from field observation to action recommendations and follow-ups.",
        mandiDirectoryDescription:
          "Locate verified mandis, infrastructure details, and nearby facilities.",
        arrivalGuidanceDescription:
          "Use arrivals and trend movements to guide farmer dispatch decisions.",
        diseaseCaptureDescription:
          "Capture crop disease evidence and route treatment guidance quickly.",
        farmPlanningDescription:
          "Align crop, irrigation, and seasonal planning with farmer-specific context.",
        farmerMarketDescription:
          "Track mandi prices, arrivals, and trend movement before sale decisions.",
        farmerOperationsDescription:
          "Plan crops and irrigation with season-aware recommendations and shared inputs.",
        diseaseUploadDescription:
          "Upload crop images to detect diseases and receive treatment guidance.",
        farmerDirectoryDescription:
          "Browse mandi profiles, facilities, and nearby market opportunities.",
        helpdeskDescription: "Raise tickets, monitor responses, and keep support actions moving.",
        adminHeroDescription:
          "A governance-ready control center for agricultural services, data quality, and operational oversight.",
        officerHeroDescription:
          "A field operations portal to move from observation to intervention with market, crop, and support intelligence.",
        farmerHeroDescription:
          "A guided agricultural workspace that connects mandi signals, crop planning, disease support, and farmer services.",
        adminWorkflow1: "Refresh master data before reviewing analytics quality.",
        adminWorkflow2: "Scan audit logs for role anomalies and stale automation runs.",
        adminWorkflow3: "Use data quality review before approving operational changes.",
        officerWorkflow1: "Open officer workflow to review field requests.",
        officerWorkflow2: "Check mandi and disease signals before advising farmers.",
        officerWorkflow3: "Close the loop with support or operations when escalation is needed.",
        farmerWorkflow1: "Start with market intelligence for nearby price context.",
        farmerWorkflow2: "Move to farm operations for crop and water planning.",
        farmerWorkflow3: "Use disease detection or helpdesk when field conditions shift.",
        activeWorkspacesLabel: "active workspaces",
        administrationMode: "Administration mode",
        extensionMode: "Extension mode",
        farmerMode: "Farmer mode",
        portalWorkflow: "Portal-led workflow",
        primaryWorkspace: "Primary workspace",
        roleTrack: "Role track",
        recommendedRoute: "Recommended route",
        defaultUserName: "KrishiMitra User",
        openLeadWorkspace: "Open lead workspace",
        guidedWorkflow: "Guided workflow",
        roleAccelerators: "Role accelerators",
      }),
      [],
    ),
  );

  const portalTone = isDark
    ? "linear-gradient(145deg, rgba(16,40,28,0.98) 0%, rgba(13,33,23,0.98) 100%)"
    : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(244,249,242,0.98) 100%)";

  const modules = useMemo<PortalModule[]>(() => {
    if (role === "admin") {
      return [
        {
          title: t("nav.admin_master_data"),
          path: "/admin/master-data",
          description: copy.adminMasterDataDescription,
          icon: <PrecisionManufacturingIcon />,
          accent: "#1f6d45",
          signal: copy.controlLayer,
          tags: [copy.records, copy.sync, copy.quality],
        },
        {
          title: t("services_page.market_intelligence_title", {
            defaultValue: "Market Intelligence",
          }),
          path: "/services/market-intelligence?tab=trends",
          description: copy.marketIntelligenceDescription,
          icon: <InsightsIcon />,
          accent: "#8f4c1a",
          signal: copy.liveAnalytics,
          tags: [copy.trends, copy.arrivals, copy.alerts],
        },
        {
          title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
          path: "/disease-detection",
          description: copy.diseaseReliabilityDescription,
          icon: <BugReportIcon />,
          accent: "#8b2f2f",
          signal: copy.fieldHealth,
          tags: [copy.visionAi, copy.cases, copy.treatment],
        },
        {
          title: t("nav.audit_logs"),
          path: "/admin/audit-logs",
          description: copy.auditLogsDescription,
          icon: <AssignmentTurnedInIcon />,
          accent: "#455a64",
          signal: copy.governance,
          tags: [copy.audit, copy.security, copy.ops],
        },
        {
          title: t("nav.data_quality"),
          path: "/admin/quality",
          description: copy.dataQualityDescription,
          icon: <VerifiedIcon />,
          accent: "#2f7c88",
          signal: copy.qualityWatch,
          tags: [copy.validation, copy.coverage, copy.confidence],
        },
      ];
    }

    if (role === "extension_officer") {
      return [
        {
          title: t("nav.officer_workflow"),
          path: "/officer/workflow",
          description: copy.officerWorkflowDescription,
          icon: <HubIcon />,
          accent: "#1f6d45",
          signal: copy.farmerWorkflow,
          tags: [copy.outreach, copy.response, copy.escalation],
        },
        {
          title: t("nav.market_directory"),
          path: "/mandi-directory",
          description: copy.mandiDirectoryDescription,
          icon: <StorefrontIcon />,
          accent: "#8f4c1a",
          signal: copy.marketAccess,
          tags: [copy.facilities, copy.contacts, copy.distance],
        },
        {
          title: t("services_page.market_intelligence_title", {
            defaultValue: "Market Intelligence",
          }),
          path: "/services/market-intelligence?tab=arrivals",
          description: copy.arrivalGuidanceDescription,
          icon: <InsightsIcon />,
          accent: "#8b5a2b",
          signal: copy.arrivalWatch,
          tags: [copy.mandis, copy.signals, copy.dispatch],
        },
        {
          title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
          path: "/disease-detection",
          description: copy.diseaseCaptureDescription,
          icon: <BugReportIcon />,
          accent: "#8b2f2f",
          signal: copy.healthAlert,
          tags: [copy.diagnosis, copy.images, copy.treatment],
        },
        {
          title: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
          path: "/services/farm-operations?tab=crop",
          description: copy.farmPlanningDescription,
          icon: <AgricultureIcon />,
          accent: "#356f31",
          signal: copy.fieldPlanning,
          tags: [copy.crop, copy.water, copy.season],
        },
      ];
    }

    return [
      {
        title: t("services_page.market_intelligence_title", {
          defaultValue: "Market Intelligence",
        }),
        path: "/services/market-intelligence?tab=price",
        description: copy.farmerMarketDescription,
        icon: <InsightsIcon />,
        accent: "#8f4c1a",
        signal: copy.priceRadar,
        tags: [copy.prices, copy.trends, copy.markets],
      },
      {
        title: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
        path: "/services/farm-operations?tab=crop",
        description: copy.farmerOperationsDescription,
        icon: <AgricultureIcon />,
        accent: "#1f6d45",
        signal: copy.seasonPlan,
        tags: [copy.crop, copy.water, copy.schedule],
      },
      {
        title: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
        path: "/disease-detection",
        description: copy.diseaseUploadDescription,
        icon: <BugReportIcon />,
        accent: "#8b2f2f",
        signal: copy.plantHealth,
        tags: [copy.visionAi, copy.treatment, copy.alerts],
      },
      {
        title: t("nav.market_directory"),
        path: "/mandi-directory",
        description: copy.farmerDirectoryDescription,
        icon: <StorefrontIcon />,
        accent: "#7a5a2d",
        signal: copy.nearestMandi,
        tags: [copy.directory, copy.distance, copy.facilities],
      },
      {
        title: t("nav.helpdesk"),
        path: "/helpdesk",
        description: copy.helpdeskDescription,
        icon: <SupportAgentIcon />,
        accent: "#2f7c88",
        signal: copy.supportLane,
        tags: [copy.tickets, copy.help, copy.resolution],
      },
    ];
  }, [copy, role, t]);

  const workflow = useMemo(() => {
    if (role === "admin") {
      return [copy.adminWorkflow1, copy.adminWorkflow2, copy.adminWorkflow3];
    }
    if (role === "extension_officer") {
      return [copy.officerWorkflow1, copy.officerWorkflow2, copy.officerWorkflow3];
    }
    return [copy.farmerWorkflow1, copy.farmerWorkflow2, copy.farmerWorkflow3];
  }, [copy, role]);

  const headerBadges = useMemo(
    () => [
      `${modules.length} ${copy.activeWorkspacesLabel}`,
      role === "admin"
        ? copy.administrationMode
        : role === "extension_officer"
          ? copy.extensionMode
          : copy.farmerMode,
      copy.portalWorkflow,
    ],
    [copy, modules.length, role],
  );

  return (
    <AppLayout>
      <Stack spacing={3}>
        <Paper
          sx={{
            position: "relative",
            overflow: "hidden",
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(31, 84, 50, 0.16)",
            background: portalTone,
            boxShadow: isDark
              ? "0 22px 44px rgba(0,0,0,0.3)"
              : "0 24px 48px rgba(20, 56, 32, 0.12)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)), url('/assets/agri-slider/slide-06.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: isDark ? 0.16 : 0.18,
            }}
          />
          <Grid container spacing={3} sx={{ position: "relative", zIndex: 1 }}>
            <Grid item xs={12} lg={8}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
                  <Avatar
                    sx={{
                      width: 54,
                      height: 54,
                      bgcolor: isDark ? alpha("#8bc88b", 0.16) : alpha("#1f6d45", 0.12),
                      color: isDark ? "#d7efd1" : "#1f6d45",
                    }}
                  >
                    <LayersIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: "2rem", md: "2.5rem" },
                        fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                      }}
                    >
                      {t("nav.portal")}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640 }}>
                      {role === "admin"
                        ? copy.adminHeroDescription
                        : role === "extension_officer"
                          ? copy.officerHeroDescription
                          : copy.farmerHeroDescription}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {headerBadges.map((badge) => (
                    <Chip
                      key={badge}
                      label={badge}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 700,
                        bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.86)",
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "1px solid rgba(31,84,50,0.08)",
                      }}
                    />
                  ))}
                </Stack>
                <Grid container spacing={1.5}>
                  {[
                    {
                      label: copy.primaryWorkspace,
                      value: modules[0]?.title ?? "Portal",
                      tone: "#1f6d45",
                    },
                    {
                      label: copy.roleTrack,
                      value: roleLabel,
                      tone: "#8f4c1a",
                    },
                    {
                      label: copy.recommendedRoute,
                      value: workflow[0],
                      tone: "#2f7c88",
                    },
                  ].map((item) => (
                    <Grid item xs={12} md={4} key={item.label}>
                      <Paper
                        elevation={0}
                        sx={{
                          height: "100%",
                          p: 1.5,
                          borderRadius: 2.5,
                          bgcolor: isDark ? alpha("#0d1f14", 0.72) : alpha("#ffffff", 0.82),
                          border: `1px solid ${alpha(item.tone, 0.16)}`,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: alpha(item.tone, 0.92), fontWeight: 800 }}
                        >
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.6, fontWeight: 700 }}>
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Grid>
            <Grid item xs={12} lg={4}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  bgcolor: isDark ? alpha("#0d1f14", 0.7) : alpha("#ffffff", 0.78),
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(31,84,50,0.1)",
                  boxShadow: "none",
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar sx={{ bgcolor: alpha("#1f6d45", 0.16), color: "#1f6d45" }}>
                        {user?.name?.[0] || "K"}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                          {user?.name || copy.defaultUserName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {roleLabel}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box
                      sx={{
                        borderRadius: 2.5,
                        overflow: "hidden",
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "1px solid rgba(31,84,50,0.12)",
                      }}
                    >
                      <Box
                        component="img"
                        src="/assets/agri-slider/slide-08.jpg"
                        alt="Portal workspace"
                        sx={{ width: "100%", height: 156, objectFit: "cover", display: "block" }}
                      />
                    </Box>
                    <Button
                      variant="contained"
                      onClick={() => navigate(modules[0]?.path || "/dashboard")}
                      endIcon={<ArrowOutwardIcon />}
                      sx={{
                        alignSelf: "flex-start",
                        fontWeight: 700,
                        textTransform: "none",
                        borderRadius: 2,
                        px: 2.2,
                      }}
                    >
                      {copy.openLeadWorkspace}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Grid container spacing={2.2}>
              {modules.map((module) => (
                <Grid item xs={12} md={6} key={module.path}>
                  <Card
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      border: `1px solid ${alpha(module.accent, 0.18)}`,
                      background: isDark
                        ? `linear-gradient(145deg, ${alpha(module.accent, 0.18)} 0%, rgba(14,30,20,0.98) 100%)`
                        : `linear-gradient(145deg, ${alpha(module.accent, 0.08)} 0%, rgba(255,255,255,0.98) 100%)`,
                      boxShadow: isDark
                        ? "0 18px 28px rgba(0,0,0,0.24)"
                        : "0 18px 28px rgba(18,58,31,0.1)",
                      transition: "transform 0.22s ease, box-shadow 0.22s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: isDark
                          ? "0 22px 36px rgba(0,0,0,0.32)"
                          : "0 22px 36px rgba(18,58,31,0.15)",
                      },
                    }}
                  >
                    <CardContent sx={{ p: 2.5, height: "100%" }}>
                      <Stack spacing={1.5} sx={{ height: "100%" }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          spacing={1.5}
                        >
                          <Avatar
                            sx={{ bgcolor: alpha(module.accent, 0.14), color: module.accent }}
                          >
                            {module.icon}
                          </Avatar>
                          <Chip
                            size="small"
                            label={module.signal}
                            sx={{
                              borderRadius: 999,
                              fontWeight: 700,
                              bgcolor: alpha(module.accent, 0.12),
                              color: module.accent,
                            }}
                          />
                        </Stack>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 800,
                              fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                            }}
                          >
                            {module.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.8, lineHeight: 1.75 }}
                          >
                            {module.description}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                          {module.tags.map((tag) => (
                            <Chip
                              key={tag}
                              size="small"
                              variant="outlined"
                              label={tag}
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                          ))}
                        </Stack>
                        <Box sx={{ mt: "auto" }}>
                          <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate(module.path)}
                            endIcon={<ArrowOutwardIcon />}
                            sx={{
                              fontWeight: 700,
                              textTransform: "none",
                              borderRadius: 2,
                              background: `linear-gradient(90deg, ${module.accent} 0%, ${alpha(module.accent, 0.82)} 100%)`,
                            }}
                          >
                            {t("actions.open", { defaultValue: "Open" })}
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Stack spacing={2.2}>
              <Paper
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(31,84,50,0.12)",
                  background: portalTone,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.2 }}>
                  {copy.guidedWorkflow}
                </Typography>
                <List disablePadding>
                  {workflow.map((step) => (
                    <ListItem key={step} disableGutters sx={{ alignItems: "flex-start", py: 1 }}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          sx={{
                            width: 26,
                            height: 26,
                            bgcolor: alpha("#1f6d45", 0.14),
                            color: "#1f6d45",
                          }}
                        >
                          <CheckCircleIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={step}
                        primaryTypographyProps={{
                          variant: "body2",
                          sx: { fontWeight: 600, lineHeight: 1.65 },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              <Paper
                sx={{
                  p: 2.4,
                  borderRadius: 3,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.1)"
                    : "1px solid rgba(31,84,50,0.12)",
                  bgcolor: isDark ? alpha("#102116", 0.82) : alpha("#ffffff", 0.9),
                }}
              >
                <Stack spacing={1.2}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {copy.roleAccelerators}
                  </Typography>
                  {modules.slice(0, 3).map((module) => (
                    <Button
                      key={module.path}
                      variant="outlined"
                      onClick={() => navigate(module.path)}
                      sx={{
                        justifyContent: "space-between",
                        textTransform: "none",
                        borderRadius: 2.2,
                        py: 1.1,
                        fontWeight: 700,
                      }}
                      endIcon={<ArrowOutwardIcon />}
                    >
                      {module.title}
                    </Button>
                  ))}
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default PortalPage;
