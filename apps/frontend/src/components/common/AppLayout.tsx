import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import LanguageIcon from "@mui/icons-material/Language";
import MenuIcon from "@mui/icons-material/Menu";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import WifiTetheringRoundedIcon from "@mui/icons-material/WifiTetheringRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/authSlice";
import { logoutAuthSession } from "../../services/auth";
import { getRefreshToken } from "../../services/authStorage";
import { buildRedirectUrl } from "../../services/links";
import { resolveWsUrl } from "../../services/runtimeConfig";
import ExternalPortalsMarquee from "./ExternalPortalsMarquee";
import ExternalLinkWarningDialog from "./ExternalLinkWarningDialog";
import LayoutFooterLinks from "./LayoutFooterLinks";
import { EXTERNAL_PORTALS, HEADER_BADGES } from "./layoutPortalData";
import WeatherWidget from "./WeatherWidget";
import { useWebSocket } from "../../utils/useWebSocket";
import { useAppTheme } from "../../hooks/useTheme";

const drawerWidth = 280;
const spacingScale = {
  xs: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
  section: 8
} as const;
const defaultAppMaxWidth = "min(98vw, 1920px)";
const horizontalSectionPaddingSx = {
  px: { xs: spacingScale.sm, md: spacingScale.lg }
} as const;
const headerContainerSx = {
  width: "100%",
  maxWidth: "100%",
  mx: 0,
  pl: { xs: 2, sm: 3, md: 4 },
  pr: { xs: 2, sm: 3, md: 4 },
  py: { xs: 1.25, md: 1.5 },
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
  alignItems: { xs: "flex-start", sm: "center" },
  gap: { xs: 1.5, md: 3 }
} as const;
const headerNavContainerSx = {
  width: "100%",
  maxWidth: "100%",
  mx: 0,
  pl: { xs: 2, sm: 3, md: 4 },
  pr: 0,
  py: { xs: spacingScale.sm, md: 1.5 },
  display: "flex",
  alignItems: { xs: "flex-start", md: "center" },
  justifyContent: "space-between",
  gap: { xs: 1.5, md: 3 },
  flexWrap: "wrap"
} as const;

interface AppLayoutProps {
  children: React.ReactNode;
  fullBleed?: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, fullBleed = false }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { mode: themeMode, toggle: toggleTheme } = useAppTheme();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [externalLinkUrl, setExternalLinkUrl] = useState<string | null>(null);
  const [externalLinkOpen, setExternalLinkOpen] = useState(false);
  const [servicesAnchorEl, setServicesAnchorEl] = useState<null | HTMLElement>(null);
  const [languageAnchorEl, setLanguageAnchorEl] = useState<null | HTMLElement>(null);
  const [liveAnchorEl, setLiveAnchorEl] = useState<null | HTMLElement>(null);
  const [networkStatus, setNetworkStatus] = useState<"online" | "offline">(
    typeof navigator !== "undefined" && navigator.onLine ? "online" : "offline"
  );
  const [showConnectedBanner, setShowConnectedBanner] = useState(false);
  const [fontScale, setFontScale] = useState<number>(() => {
    const stored = Number(localStorage.getItem("fontScale") || "1");
    if (Number.isNaN(stored)) return 1;
    return Math.min(Math.max(stored, 0.9), 1.3);
  });
  const [realtimeEvents, setRealtimeEvents] = useState<
    { id: string; summary: string; time: string; severity?: "info" | "success" | "warning" }[]
  >([]);

  const navItems = useMemo(() => {
    const items = [
      { label: t("nav.dashboard"), path: "/dashboard" },
      { label: t("nav.portal"), path: "/portal" },
      { label: t("nav.market_directory"), path: "/mandi-directory" },
      { label: t("nav.market_intelligence", { defaultValue: "Market Intelligence" }), path: "/services/market-intelligence" },
      { label: t("nav.helpdesk"), path: "/helpdesk" },
      { label: t("nav.advisory"), path: "/advisory" },
      { label: t("layout.nav_notices"), path: "/notices" },
    ];
    if (user?.role === "extension_officer" || user?.role === "admin") {
      items.push({ label: t("nav.officer_workflow"), path: "/officer/workflow" });
    }
    if (user?.role === "admin") {
      items.push({ label: t("nav.admin_master_data"), path: "/admin/master-data" });
      items.push({ label: t("nav.audit_logs"), path: "/admin/audit-logs" });
      items.push({ label: t("nav.data_quality"), path: "/admin/quality" });
    }
    return items;
  }, [t, user?.role]);
  const topNavItems = useMemo(
    () =>
      navItems.filter(
        (item) =>
          ![
            "/portal",
            "/mandi-directory",
            "/services/market-intelligence",
            "/helpdesk"
          ].includes(item.path)
      ),
    [navItems]
  );

  const languages = useMemo(
    () => [
      { code: "en", label: t("languages.en") },
      { code: "hi", label: t("languages.hi") },
      { code: "bn", label: t("languages.bn") },
      { code: "ta", label: t("languages.ta") },
      { code: "te", label: t("languages.te") },
      { code: "mr", label: t("languages.mr") },
      { code: "gu", label: t("languages.gu") },
      { code: "kn", label: t("languages.kn") },
      { code: "pa", label: t("languages.pa") },
      { code: "as", label: t("languages.as") },
      { code: "ml", label: t("languages.ml") },
      { code: "or", label: t("languages.or") },
      { code: "ur", label: t("languages.ur") },
      { code: "ne", label: t("languages.ne") },
      { code: "sa", label: t("languages.sa") }
    ],
    [t]
  );
  const languageShort = useMemo(
    () => String(i18n.language || "en").split("-")[0].toUpperCase(),
    [i18n.language]
  );

  const serviceItems = useMemo(
    () => [
      {
        label: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
        path: "/services/farm-operations"
      },
      {
        label: t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
        path: "/services/market-intelligence"
      },
      {
        label: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
        path: "/disease-detection"
      },
      { label: t("dashboard.feedback"), path: "/services/feedback" },
      { label: t("nav.market_directory"), path: "/mandi-directory" },
      { label: t("nav.helpdesk"), path: "/helpdesk" },
      { label: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }), path: "/services/modern-farming" }
    ],
    [t]
  );
  const serviceMenuItems = useMemo(
    () => [{ label: t("layout.service_map"), path: "/services" }, ...serviceItems],
    [serviceItems, t]
  );
  const externalPortals = EXTERNAL_PORTALS;
  const slidingExternalPortals = useMemo(() => [...externalPortals, ...externalPortals], [externalPortals]);
  const headerBadges = HEADER_BADGES;
  const wsBaseUrl = resolveWsUrl(import.meta.env.VITE_WS_URL as string | undefined);
  const wsUrl = accessToken ? wsBaseUrl : undefined;
  const wsAuthMessage = accessToken ? JSON.stringify({ type: "auth", token: accessToken }) : undefined;
  const { status: wsStatus, lastEvent } = useWebSocket(wsUrl, wsAuthMessage);

  useEffect(() => {
    const safeScale = Math.min(Math.max(fontScale, 0.9), 1.3);
    document.documentElement.style.fontSize = `${16 * safeScale}px`;
    localStorage.setItem("fontScale", String(safeScale));
  }, [fontScale]);

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus("online");
      setShowConnectedBanner(true);
    };
    const handleOffline = () => {
      setNetworkStatus("offline");
      setShowConnectedBanner(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!showConnectedBanner) return;
    const timeout = window.setTimeout(() => setShowConnectedBanner(false), 3500);
    return () => window.clearTimeout(timeout);
  }, [showConnectedBanner]);

  useEffect(() => {
    if (!lastEvent || typeof lastEvent !== "object") return;
    const eventType = String((lastEvent as Record<string, unknown>).event || "");
    const timestamp = String(
      (lastEvent as Record<string, unknown>).server_time ||
        (lastEvent as Record<string, unknown>).triggered_at ||
        new Date().toISOString()
    );

    let summary = eventType || "event";
    let severity: "info" | "success" | "warning" = "info";
    if (eventType.startsWith("operation")) {
      const operation = String((lastEvent as Record<string, unknown>).operation || "");
      summary = `Operation ${operation.replace(/_/g, " ")} ${eventType.includes("scheduled") ? "scheduled" : "triggered"}`;
      severity = "success";
    } else if (eventType === "feedback.submitted") {
      summary = `Outcome feedback recorded (rating ${String((lastEvent as Record<string, unknown>).rating || "-")})`;
      severity = "info";
    } else if (eventType === "feedback.quick_submitted") {
      summary = `Quick rating received for ${String((lastEvent as Record<string, unknown>).service || "service")}`;
      severity = "info";
    } else if (eventType === "connected") {
      summary = "Realtime channel connected";
      severity = "success";
    }

    setRealtimeEvents((prev) => [{ id: `${eventType}-${timestamp}`, summary, time: timestamp, severity }, ...prev].slice(0, 5));
  }, [lastEvent]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutAuthSession(refreshToken);
      } catch {
      }
    }
    dispatch(logout());
    navigate("/login");
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleServicesOpen = (event: React.MouseEvent<HTMLElement>) => {
    setServicesAnchorEl(event.currentTarget);
  };

  const handleServicesClose = () => {
    setServicesAnchorEl(null);
  };

  const handleLanguageOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchorEl(null);
  };

  const handleLiveOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLiveAnchorEl(event.currentTarget);
  };

  const handleLiveClose = () => {
    setLiveAnchorEl(null);
  };

  const handleServiceNavigate = (path: string) => {
    handleServicesClose();
    handleNav(path);
  };


  const handleOpenProfile = () => {
    navigate("/profile");
    setMobileOpen(false);
  };

  const handleLanguageChange = (value: string) => {
    localStorage.setItem("language", value);
    i18n.changeLanguage(value);
  };
  const handleLanguageSelect = (value: string) => {
    handleLanguageChange(value);
    handleLanguageClose();
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const handleExternalLink = (url: string) => {
    setExternalLinkUrl(url);
    setExternalLinkOpen(true);
  };

  const handleExternalClose = () => {
    setExternalLinkOpen(false);
    setExternalLinkUrl(null);
  };

  const handleExternalConfirm = () => {
    const url = externalLinkUrl;
    setExternalLinkOpen(false);
    setExternalLinkUrl(null);
    if (url) {
      const redirectUrl = buildRedirectUrl(url);
      window.open(redirectUrl, "_blank", "noopener,noreferrer");
    }
  };

  const userInitials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KM";
  const userAvatar = user?.profile_image_url?.trim() ? user.profile_image_url : undefined;
  const contentShellSx = {
    width: "100%",
    maxWidth: fullBleed ? "none" : defaultAppMaxWidth,
    mx: fullBleed ? 0 : "auto"
  } as const;

  const userRoleLabel = useMemo(() => {
    if (!user?.role) return t("layout.default_role");
    if (user.role === "farmer") return t("auth.role_farmer");
    if (user.role === "extension_officer") return t("auth.role_extension_officer");
    if (user.role === "admin") return t("layout.role_admin");
    return user.role;
  }, [t, user?.role]);
  const livePopoverOpen = Boolean(liveAnchorEl);
  const isOffline = networkStatus === "offline";
  const liveStatusLabel = useMemo(
    () =>
      t(`dashboard_page.ws_status.${wsStatus}`, {
        defaultValue: wsStatus
      }),
    [t, wsStatus]
  );
  const liveStatusColor =
    wsStatus === "open" ? "success" : wsStatus === "connecting" ? "warning" : wsStatus === "error" ? "error" : "default";
  const livePulseSx = {
    width: 10,
    height: 10,
    borderRadius: "50%",
    bgcolor: wsStatus === "open" ? "#8be28b" : "rgba(255,255,255,0.5)",
    boxShadow: wsStatus === "open" ? "0 0 0 0 rgba(139, 226, 139, 0.7)" : "none",
    animation: wsStatus === "open" ? "livePulse 1.4s ease-out infinite" : "none",
    "@keyframes livePulse": {
      "0%": { boxShadow: "0 0 0 0 rgba(139, 226, 139, 0.7)" },
      "70%": { boxShadow: "0 0 0 10px rgba(139, 226, 139, 0)" },
      "100%": { boxShadow: "0 0 0 0 rgba(139, 226, 139, 0)" }
    }
  } as const;

  const currentSeasonLabel = useMemo(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 10) return "Kharif";
    if (month >= 11 || month <= 3) return "Rabi";
    return "Zaid";
  }, []);
  const isDark = themeMode === "dark";
  const footerFeatureColumns = useMemo(
    () => [
      [
        { label: t("nav.dashboard"), path: "/dashboard" },
        { label: t("nav.portal"), path: "/portal" },
        { label: t("nav.advisory"), path: "/advisory" },
        { label: t("layout.nav_notices"), path: "/notices" },
        { label: t("layout.service_map"), path: "/services" }
      ],
        [
          {
            label: t("services_page.farm_operations_title", { defaultValue: "Farm Operations" }),
            path: "/services/farm-operations"
          },
          {
            label: t("services_page.market_intelligence_title", { defaultValue: "Market Intelligence" }),
            path: "/services/market-intelligence"
          },
          {
            label: t("services_page.disease_detection_title", { defaultValue: "Disease Detection" }),
            path: "/disease-detection"
          },
          { label: t("dashboard.feedback"), path: "/services/feedback" },
          {
            label: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }),
            path: "/services/modern-farming"
          }
      ],
      [
        { label: t("nav.market_directory"), path: "/mandi-directory" },
        { label: t("nav.helpdesk"), path: "/helpdesk" },
        { label: t("profile.title", { defaultValue: "Profile" }), path: "/profile" }
      ]
    ],
    [t]
  );
  const navButtonSx = {
    borderBottom: "2px solid transparent",
    borderRadius: 0,
    px: 1.25,
    py: 0.75,
    fontSize: { xs: "1.08rem", md: "1.16rem" },
    fontWeight: 700,
    "&:hover": {
      borderBottomColor: "rgba(255,255,255,0.55)",
      backgroundColor: "rgba(255,255,255,0.08)",
    },
  } as const;
  const servicesMenuOpen = Boolean(servicesAnchorEl);
  const languageMenuOpen = Boolean(languageAnchorEl);

  const accountActions = (
    <Stack direction="row" spacing={1} alignItems="center">
      <ButtonBase
        onClick={handleOpenProfile}
        aria-label="Open profile"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 0.75,
          bgcolor: isMobile ? "rgba(27,107,58,0.1)" : "rgba(255,255,255,0.12)",
          border: isMobile ? "1px solid rgba(27,107,58,0.2)" : "1px solid rgba(255,255,255,0.25)",
          borderRadius: 1,
          px: 0.75,
          py: 0.35,
          "&:hover": {
            bgcolor: isMobile ? "rgba(27,107,58,0.16)" : "rgba(255,255,255,0.2)"
          }
        }}
      >
        <Avatar
          src={userAvatar}
          alt={user?.name || t("layout.default_user")}
          sx={{ bgcolor: "#1f7d43", width: 30, height: 30 }}
        >
          {userInitials}
        </Avatar>
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ color: isMobile ? "text.primary" : "#fff", lineHeight: 1.1, fontSize: "0.95rem" }}
          >
            {user?.name || t("layout.default_user")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: isMobile ? "text.secondary" : "rgba(255,255,255,0.85)", lineHeight: 1.1, fontSize: "0.78rem" }}
          >
            {userRoleLabel}
          </Typography>
        </Box>
      </ButtonBase>
    </Stack>
  );

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Box
          role="button"
          tabIndex={0}
          onClick={handleOpenProfile}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleOpenProfile();
            }
          }}
          aria-label="Open profile"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            borderRadius: 2.5,
            border: "1px solid rgba(27, 107, 58, 0.2)",
            bgcolor: "rgba(27, 107, 58, 0.06)",
            px: 1.4,
            py: 1,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(27, 107, 58, 0.12)" },
            "&:focus-visible": { outline: "2px solid rgba(27, 107, 58, 0.6)", outlineOffset: 2 }
          }}
        >
          <Avatar
            src={userAvatar}
            alt={user?.name || t("layout.default_user")}
            sx={{ bgcolor: "#1f7d43", width: 40, height: 40 }}
          >
            {userInitials}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {user?.name || t("layout.default_user")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userRoleLabel}
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            {themeMode === "dark" ? <DarkModeIcon color="action" /> : <LightModeIcon color="action" />}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {themeMode === "dark" ? "Dark mode" : "Light mode"}
            </Typography>
          </Stack>
          <Switch
            checked={themeMode === "dark"}
            onChange={handleThemeToggle}
            inputProps={{ "aria-label": "Toggle dark mode" }}
            color="success"
          />
        </Stack>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton key={item.path} onClick={() => handleNav(item.path)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Typography variant="overline" color="text.secondary">
          {t("layout.services")}
        </Typography>
        <List>
          {serviceItems.map((item) => (
            <ListItemButton key={item.path} onClick={() => handleNav(item.path)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <Button variant="outlined" startIcon={<LogoutIcon />} onClick={handleLogout}>
          {t("nav.logout")}
        </Button>
      </Stack>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: isDark ? "#0f1d15" : "#e7f3e4",
        backgroundImage: isDark
          ? "linear-gradient(rgba(11, 20, 15, 0.96), rgba(16, 29, 21, 0.96)), url('/assets/backgrounds/OIP.webp')"
          : "linear-gradient(rgba(221, 241, 216, 0.97), rgba(230, 245, 224, 0.97)), url('/assets/backgrounds/OIP.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
        overflowX: "hidden"
      }}
    >
      <Box>
        <Box
          sx={{
          bgcolor: isDark ? "#133621" : "#1b5e20",
          background: isDark
            ? "linear-gradient(90deg, #0f2e1c 0%, #143a24 55%, #123620 100%)"
            : "linear-gradient(90deg, #145a2d 0%, #1b6f36 55%, #1a5f30 100%)",
          color: "#fff",
          px: 0,
          py: 0,
          borderTop: "4px solid #c75b22",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.18)"
        }}
      >
        <Box sx={headerContainerSx}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              pr: { xs: 0, md: 2 },
              py: 0.2,
              minWidth: 0
            }}
          >
            <ButtonBase
              onClick={() => handleNav("/")}
              aria-label="Go to dashboard"
              sx={{ display: "inline-flex", alignItems: "center" }}
            >
              <Box
                component="img"
                src="/assets/logo/krishimitra-ai-icon-transparent.png"
                alt="KrishiMitra-AI logo"
                sx={{
                  height: { xs: 40, sm: 46, md: 52 },
                  width: "auto",
                  objectFit: "contain",
                  mr: 0.4,
                  borderRadius: "50%"
                }}
              />
            </ButtonBase>
            <Stack spacing={0.2}>
              <Typography
                sx={{
                  color: "#fff",
                  fontFamily: '"Prata", serif',
                  fontWeight: 400,
                  letterSpacing: 0.3,
                  fontSize: { xs: "2rem", md: "2.45rem" },
                  lineHeight: 1.04,
                  textShadow: "0 2px 6px rgba(0,0,0,0.22)"
                }}
              >
                {t("app.title")}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(241,255,245,0.97)",
                  fontFamily: '"Mukta", sans-serif',
                  fontWeight: 700,
                  lineHeight: 1.16,
                  fontSize: { xs: "1.16rem", md: "1.34rem" },
                  letterSpacing: 0.2
                }}
              >
                {t("layout.dbt_portal")}
              </Typography>
              <Typography
                sx={{
                  color: "rgba(235,247,238,0.9)",
                  fontFamily: '"Mukta", sans-serif',
                  fontWeight: 500,
                  lineHeight: 1.18,
                  fontSize: { xs: "0.98rem", md: "1.08rem" }
                }}
              >
                {t("app.subtitle")}
              </Typography>
              <Box
                sx={{
                  width: { xs: 170, md: 240 },
                  height: 2,
                  borderRadius: 99,
                  bgcolor: "rgba(191, 232, 202, 0.8)",
                  mt: 0.3
                }}
              />
            </Stack>
          </Stack>
          <Stack
            spacing={0.55}
            alignItems={{ xs: "flex-start", sm: "flex-end" }}
            sx={{
              width: { xs: "100%", sm: "auto" },
              justifySelf: { sm: "end" },
              bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 2,
              px: { xs: 1, sm: 1.4 },
              py: { xs: 0.8, sm: 1 }
            }}
            >
              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{
                  flexWrap: "wrap",
                  justifyContent: { xs: "flex-start", sm: "flex-end" },
                  rowGap: 0.6,
                  columnGap: 0.6
                }}
              >
                <Stack direction="row" spacing={0.75}>
                  {[0.95, 1, 1.1].map((scale, index) => (
                    <Button
                      key={String(scale)}
                    size="small"
                    variant={Math.abs(fontScale - scale) < 0.01 ? "contained" : "outlined"}
                    onClick={() => setFontScale(scale)}
                    sx={{
                      minWidth: 30,
                      height: 30,
                      px: 0.8,
                      fontSize: "0.85rem",
                      borderColor: "rgba(255,255,255,0.4)",
                      color: "#fff",
                      bgcolor: Math.abs(fontScale - scale) < 0.01 ? "rgba(255,255,255,0.25)" : "transparent"
                    }}
                  >
                    {index === 0 ? "A-" : index === 1 ? "A" : "A+"}
                    </Button>
                  ))}
                </Stack>
                {showConnectedBanner && !isOffline && (
                  <Chip
                    label="Connected to internet"
                    size="small"
                    sx={{
                      bgcolor: "rgba(30, 125, 68, 0.9)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.35)",
                      fontWeight: 700,
                      height: 30
                    }}
                  />
                )}
                {isOffline && (
                  <Chip
                    icon={<WifiOffRoundedIcon sx={{ color: "#fff" }} fontSize="small" />}
                    label="You are offline"
                    size="small"
                    sx={{
                      bgcolor: "rgba(201, 48, 44, 0.9)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.35)",
                      fontWeight: 700,
                      height: 30,
                      "& .MuiChip-icon": { color: "#fff" }
                    }}
                  />
                )}
                <Tooltip title={t("languages.title", { defaultValue: "Language" })}>
                  <ButtonBase
                  onClick={handleLanguageOpen}
                  aria-label="Change language"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    border: "1px solid rgba(255,255,255,0.35)",
                    color: "#fff",
                    borderRadius: 1,
                    px: 0.7,
                    py: 0.35,
                    "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.12)" }
                  }}
                >
                  <LanguageIcon fontSize="small" />
                  <Typography variant="caption" sx={{ color: "#fff", fontWeight: 700, letterSpacing: 0.4 }}>
                    {languageShort}
                  </Typography>
                </ButtonBase>
              </Tooltip>
              {!isMobile && (
                <>
                  <ButtonBase
                    onClick={handleOpenProfile}
                    aria-label="Open profile"
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 0.65,
                      bgcolor: "transparent",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: 1,
                      px: 0.7,
                      py: 0.25,
                      "&:hover": {
                        bgcolor: "rgba(255,255,255,0.12)"
                      }
                    }}
                  >
                    <Avatar
                      src={userAvatar}
                      alt={user?.name || t("layout.default_user")}
                      sx={{ bgcolor: "#1f7d43", width: 30, height: 30 }}
                    >
                      {userInitials}
                    </Avatar>
                    <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "#fff", lineHeight: 1.1, fontSize: "0.92rem" }}
                    >
                      {user?.name || t("layout.default_user")}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.1, fontSize: "0.76rem" }}
                    >
                      {userRoleLabel}
                    </Typography>
                  </Box>
                </ButtonBase>
                </>
              )}
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                width: "100%",
                justifyContent: { xs: "flex-start", sm: "flex-end" },
                flexWrap: "wrap",
                rowGap: 0.6
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{ display: { xs: "none", md: "flex" }, justifyContent: "flex-end", flexWrap: "wrap" }}
              >
                {headerBadges.map((badge) => (
                  <ButtonBase
                    key={badge.name}
                    component="button"
                    onClick={() => handleExternalLink(badge.url)}
                    sx={{
                      borderRadius: 1,
                      px: 0.25,
                      py: 0.1,
                      position: "relative"
                    }}
                    aria-label={`Open ${badge.name}`}
                  >
                    <Box
                      component="img"
                      src={badge.logoSrc}
                      alt={badge.name}
                      sx={{
                        height: 56,
                        width: "auto",
                        maxWidth: 200,
                        objectFit: "contain",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                      }}
                    />
                  </ButtonBase>
                ))}
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: isDark ? "#3d6a42" : "#8ec78d",
          background: isDark
            ? "linear-gradient(90deg, #355d3a 0%, #447049 55%, #355d3a 100%)"
            : "linear-gradient(90deg, #8cc78a 0%, #98d29a 55%, #8cc78a 100%)",
          borderBottom: "1px solid #4f9454",
          px: 0,
          py: 0,
          boxShadow: "0 8px 20px rgba(26, 72, 28, 0.2)",
          color: isDark ? "#e8f5ee" : "#102015"
        }}
      >
        <Box sx={headerNavContainerSx}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={spacingScale.sm}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
            sx={{ width: "100%" }}
          >
            <Stack spacing={spacingScale.xs}>
              {isMobile ? (
                <IconButton color="inherit" onClick={() => setMobileOpen(true)}>
                  <MenuIcon />
                </IconButton>
              ) : (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{
                    flexWrap: { xs: "wrap", md: "nowrap" },
                    rowGap: 1,
                    columnGap: 1,
                    whiteSpace: "nowrap",
                    overflowX: { md: "auto" }
                  }}
                >
                  <IconButton color="inherit" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                    <MenuIcon />
                  </IconButton>
                  {topNavItems.map((item) => (
                    <Button
                      key={item.path}
                      color="inherit"
                      onClick={() => handleNav(item.path)}
                      sx={{
                        ...navButtonSx,
                        borderBottom:
                          location.pathname === item.path ? "2px solid rgba(255,255,255,0.95)" : "2px solid transparent"
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <Button
                    color="inherit"
                    onClick={handleServicesOpen}
                    endIcon={<KeyboardArrowDownIcon />}
                    aria-controls={servicesMenuOpen ? "services-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={servicesMenuOpen ? "true" : undefined}
                    sx={navButtonSx}
                  >
                    {t("layout.services")}
                  </Button>
                </Stack>
              )}
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                width: { xs: "100%", md: "auto" },
                justifyContent: { xs: "flex-start", md: "flex-end" },
                flexWrap: "wrap",
                rowGap: 0.6,
                flexShrink: 0
              }}
            >
              <Chip
                label={`${t("dashboard_page.crop.season")}: ${currentSeasonLabel}`}
                color="success"
                variant="outlined"
                size="small"
                sx={{
                  bgcolor: "#2f6a3a",
                  borderColor: "#2f6a3a",
                  color: "#fff",
                  fontWeight: 600,
                  height: 32,
                  px: 0.9,
                  fontSize: "0.86rem"
                }}
              />
              <Box
                sx={{
                  display: "grid",
                  rowGap: 0.6,
                  px: 0.9,
                  py: 0.6,
                  borderRadius: 1.8,
                  border: "1px solid rgba(255,255,255,0.3)",
                  bgcolor: "rgba(14, 54, 30, 0.7)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)",
                  maxWidth: { xs: "100%", sm: 520 }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <ButtonBase
                    onClick={handleLiveOpen}
                    aria-label={t("dashboard_page.live_updates")}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.6,
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "none",
                      borderRadius: 1,
                      px: 0.5,
                      py: 0.2,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.12)" }
                    }}
                  >
                    <Box sx={livePulseSx} />
                    <WifiTetheringRoundedIcon fontSize="small" />
                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700 }}>
                      {t("dashboard_page.live_updates")}
                    </Typography>
                  </ButtonBase>
                  <Chip
                    label={liveStatusLabel}
                    color={liveStatusColor}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.16)",
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.3)",
                      fontWeight: 700
                    }}
                  />
                </Stack>
                <WeatherWidget compact tone="dark" />
              </Box>
              {isMobile && accountActions}
            </Stack>
          </Stack>
        </Box>
      </Box>
      </Box>

      <Menu
        id="services-menu"
        anchorEl={servicesAnchorEl}
        open={servicesMenuOpen}
        onClose={handleServicesClose}
        MenuListProps={{ "aria-label": t("layout.services") }}
      >
        {serviceMenuItems.map((item) => (
          <MenuItem key={item.path} onClick={() => handleServiceNavigate(item.path)}>
            {item.label}
          </MenuItem>
        ))}
      </Menu>

      <Menu
        id="language-menu"
        anchorEl={languageAnchorEl}
        open={languageMenuOpen}
        onClose={handleLanguageClose}
        MenuListProps={{ "aria-label": t("languages.title", { defaultValue: "Language" }) }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            selected={i18n.language === lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
          >
            {lang.label}
          </MenuItem>
        ))}
      </Menu>

      <Popover
        open={livePopoverOpen}
        anchorEl={liveAnchorEl}
        onClose={handleLiveClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            p: 2,
            width: { xs: "88vw", sm: 340 },
            maxWidth: 380,
            borderRadius: 2.5,
            border: "1px solid rgba(23, 70, 38, 0.2)",
            background: "linear-gradient(135deg, rgba(249, 255, 249, 0.98), rgba(230, 246, 235, 0.98))",
            boxShadow: "0 16px 32px rgba(16, 62, 33, 0.28)"
          }
        }}
      >
        <Stack spacing={1.4}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={livePulseSx} />
              <WifiTetheringRoundedIcon sx={{ color: "#1b6b3a" }} fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("dashboard_page.live_updates")}
              </Typography>
            </Stack>
            <Chip label={liveStatusLabel} color={liveStatusColor} size="small" />
          </Stack>
          <Divider />
          {realtimeEvents.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t("dashboard_page.ws_status.idle", { defaultValue: "Awaiting updates..." })}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {realtimeEvents.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    border: "1px solid rgba(27, 107, 58, 0.16)",
                    bgcolor: "rgba(255,255,255,0.9)"
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.summary}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(item.time).toLocaleString()}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Popover>
      

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        component="main"
        sx={{
          ...horizontalSectionPaddingSx,
          pt: { xs: spacingScale.sm, md: spacingScale.md },
          pb: { xs: spacingScale.lg, md: spacingScale.xl },
          width: "100%"
        }}
      >
        <Box sx={contentShellSx}>{children}</Box>
      </Box>

      <ExternalPortalsMarquee
        externalPortals={externalPortals}
        slidingExternalPortals={slidingExternalPortals}
        horizontalSectionPaddingSx={horizontalSectionPaddingSx}
        contentShellSx={contentShellSx}
        onExternalLink={handleExternalLink}
      />

      <Box sx={{ ...horizontalSectionPaddingSx, py: 2.5 }}>
        <Box sx={contentShellSx}>
          <Paper sx={{ p: 2.25, border: "1px solid #e6dcc9" }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TipsAndUpdatesIcon color="secondary" />
              <Box>
                <Typography variant="subtitle1">{t("dashboard_page.advisory_tip.title")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("dashboard_page.advisory_tip.description")}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>

      <LayoutFooterLinks
        appTitle={t("app.title")}
        dbtPortalLabel={t("layout.dbt_portal")}
        otherLinksLabel={t("layout.other_links", { defaultValue: "Other Links" })}
        helpdeskLabel={t("layout.helpdesk")}
        helplineLabel={t("layout.helpline")}
        footerFeatureColumns={footerFeatureColumns}
        onNavigate={handleNav}
        horizontalSectionPaddingSx={horizontalSectionPaddingSx}
        contentShellSx={contentShellSx}
      />

      <ExternalLinkWarningDialog
        open={externalLinkOpen}
        url={externalLinkUrl}
        onClose={handleExternalClose}
        onConfirm={handleExternalConfirm}
      />
    </Box>
  );
};

export default AppLayout;
