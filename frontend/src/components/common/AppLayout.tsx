import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery
} from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import DragHandleIcon from "@mui/icons-material/DragHandle";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { logout } from "../../store/authSlice";
import { logoutAuthSession } from "../../services/auth";
import { getRefreshToken } from "../../services/authStorage";
import ExternalPortalsMarquee from "./ExternalPortalsMarquee";
import LayoutFooterLinks from "./LayoutFooterLinks";
import { EXTERNAL_PORTALS, HEADER_BADGES } from "./layoutPortalData";

const drawerWidth = 280;
const spacingScale = {
  xs: 1, // 8px
  sm: 2, // 16px
  md: 3, // 24px
  lg: 4, // 32px
  xl: 6, // 48px
  section: 8 // 64px
} as const;
const defaultAppMaxWidth = "min(96vw, 1760px)";
const horizontalSectionPaddingSx = {
  px: { xs: spacingScale.sm, md: spacingScale.lg }
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
  const isMobile = useMediaQuery("(max-width:900px)");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesAnchorEl, setServicesAnchorEl] = useState<null | HTMLElement>(null);
  const [fontScale, setFontScale] = useState<number>(() => {
    const stored = Number(localStorage.getItem("fontScale") || "1");
    if (Number.isNaN(stored)) return 1;
    return Math.min(Math.max(stored, 0.9), 1.3);
  });

  const navItems = useMemo(
    () => [
      { label: t("nav.dashboard"), path: "/dashboard" },
      { label: t("nav.advisory"), path: "/advisory" },
      { label: t("layout.nav_notices"), path: "/notices" }
    ],
    [t]
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

  const serviceItems = useMemo(
    () => [
      { label: t("dashboard.crop"), path: "/services/crop" },
      { label: t("dashboard.price"), path: "/services/price" },
      { label: t("dashboard.water"), path: "/services/water" },
      { label: t("dashboard.feedback"), path: "/services/feedback" },
      { label: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }), path: "/services/modern-farming" }
    ],
    [t]
  );
  const externalPortals = EXTERNAL_PORTALS;
  const slidingExternalPortals = useMemo(() => [...externalPortals, ...externalPortals], [externalPortals]);
  const headerBadges = HEADER_BADGES;

  useEffect(() => {
    const safeScale = Math.min(Math.max(fontScale, 0.9), 1.3);
    document.documentElement.style.fontSize = `${16 * safeScale}px`;
    localStorage.setItem("fontScale", String(safeScale));
  }, [fontScale]);

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutAuthSession(refreshToken);
      } catch {
        // local session is cleared regardless of remote call result
      }
    }
    dispatch(logout());
    navigate("/login");
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setServicesAnchorEl(null);
  };

  const handleOpenProfile = () => {
    navigate("/profile");
    setMobileOpen(false);
    setServicesAnchorEl(null);
  };

  const handleServiceOpen = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setServicesAnchorEl(null);
  };

  const handleLanguageChange = (value: string) => {
    localStorage.setItem("language", value);
    i18n.changeLanguage(value);
  };

  const userInitials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "KM";
  const servicesMenuOpen = Boolean(servicesAnchorEl);
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

  const currentSeasonLabel = useMemo(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 6 && month <= 10) return "Kharif";
    if (month >= 11 || month <= 3) return "Rabi";
    return "Zaid";
  }, []);
  const footerFeatureColumns = useMemo(
    () => [
      [
        { label: t("nav.dashboard"), path: "/dashboard" },
        { label: t("nav.advisory"), path: "/advisory" },
        { label: t("layout.nav_notices"), path: "/notices" },
        { label: t("layout.service_map"), path: "/services" }
      ],
      [
        { label: t("dashboard.crop"), path: "/services/crop" },
        { label: t("dashboard.price"), path: "/services/price" },
        { label: t("dashboard.water"), path: "/services/water" },
        { label: t("dashboard.feedback"), path: "/services/feedback" }
      ],
      [
        { label: t("layout.modern_farming", { defaultValue: "Modern Farming (250)" }), path: "/services/modern-farming" },
        { label: t("dashboard_page.weather.title"), path: "/dashboard#weather-section" },
        { label: t("dashboard_page.mandi.title"), path: "/dashboard#mandi-section" },
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
          borderRadius: 999,
          px: 0.75,
          py: 0.35,
          "&:hover": {
            bgcolor: isMobile ? "rgba(27,107,58,0.16)" : "rgba(255,255,255,0.2)"
          }
        }}
      >
        <Avatar sx={{ bgcolor: "#1f7d43", width: 30, height: 30 }}>{userInitials}</Avatar>
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
      <Tooltip title={t("nav.logout")}>
        <IconButton
          aria-label={t("nav.logout")}
          onClick={handleLogout}
          size="large"
          sx={{
            border: "1px solid",
            borderColor: isMobile ? "rgba(27,107,58,0.35)" : "rgba(255,255,255,0.45)",
            color: isMobile ? "#1b6b3a" : "#fff",
            borderRadius: 2,
            p: 0.75,
            "&:hover": isMobile
              ? { borderColor: "#1b6b3a", bgcolor: "rgba(27,107,58,0.08)" }
              : { borderColor: "#fff", bgcolor: "rgba(255,255,255,0.08)" }
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  const drawerContent = (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ bgcolor: "rgba(27, 107, 58, 0.2)", color: "#1b6b3a" }}>
            <AgricultureIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t("app.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("app.subtitle")}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton key={item.path} onClick={() => handleNav(item.path)}>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <ListItemButton onClick={handleOpenProfile}>
          <ListItemText primary={t("profile.title", { defaultValue: "Profile" })} />
        </ListItemButton>
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
        bgcolor: "#e7f3e4",
        backgroundImage:
          "linear-gradient(rgba(221, 241, 216, 0.97), rgba(230, 245, 224, 0.97)), url('/assets/backgrounds/OIP.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat"
      }}
    >
      <CssBaseline />

      <Box>
      <Box
        sx={{
          bgcolor: "#1b5e20",
          background: "linear-gradient(90deg, #145a2d 0%, #1b6f36 55%, #1a5f30 100%)",
          color: "#fff",
          ...horizontalSectionPaddingSx,
          py: { xs: 0.75, md: 1 },
          borderTop: "4px solid #c75b22",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.18)"
        }}
      >
        <Box sx={contentShellSx}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
          <Stack
            spacing={0.2}
            sx={{
              pr: { xs: 0, md: 2 },
              py: 0.2
            }}
          >
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
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              width: { xs: "100%", md: "auto" },
              bgcolor: { xs: "transparent", md: "rgba(185, 210, 92, 0.16)" },
              borderLeft: { xs: "none", md: "1px solid rgba(255,255,255,0.35)" },
              borderRadius: { xs: 0, md: 2.5 },
              px: { xs: 0, md: 0.75 },
              py: { xs: 0, md: 0.3 }
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
                    minWidth: 32,
                    height: 32,
                    borderColor: "rgba(255,255,255,0.4)",
                    color: "#fff",
                    bgcolor: Math.abs(fontScale - scale) < 0.01 ? "rgba(255,255,255,0.25)" : "transparent"
                  }}
                >
                  {index === 0 ? "A-" : index === 1 ? "A" : "A+"}
                </Button>
              ))}
            </Stack>
            <TextField
              select
              size="small"
              value={i18n.language}
              onChange={(event) => handleLanguageChange(String(event.target.value))}
              sx={{
                minWidth: { xs: 126, md: 150 },
                "& .MuiOutlinedInput-root": {
                  bgcolor: "rgba(255,255,255,0.15)",
                  color: "#fff",
                  height: 42
                },
                "& .MuiSvgIcon-root": { color: "#fff" }
              }}
            >
              {languages.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.label}
                </MenuItem>
              ))}
            </TextField>
            {!isMobile && accountActions}
          </Stack>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          bgcolor: "#6bb16c",
          background: "linear-gradient(90deg, #65ad67 0%, #74ba75 55%, #66ad68 100%)",
          borderBottom: "1px solid #4f9454",
          ...horizontalSectionPaddingSx,
          py: { xs: spacingScale.sm, md: 1.5 },
          boxShadow: "0 8px 20px rgba(26, 72, 28, 0.2)",
          color: "#102015"
        }}
      >
        <Box sx={contentShellSx}>
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
                <Stack direction="row" spacing={1} alignItems="center">
                  {navItems.map((item) => (
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
                    onClick={(event) => setServicesAnchorEl(event.currentTarget)}
                    endIcon={<KeyboardArrowDownIcon fontSize="small" />}
                    sx={{
                      ...navButtonSx,
                      borderBottom:
                        location.pathname.startsWith("/services") || servicesMenuOpen
                          ? "2px solid rgba(255,255,255,0.95)"
                          : "2px solid transparent"
                    }}
                  >
                    {t("layout.services")}
                  </Button>
                </Stack>
              )}
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                label={`${t("dashboard_page.crop.season")}: ${currentSeasonLabel}`}
                color="success"
                variant="outlined"
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.12)",
                  borderColor: "rgba(255,255,255,0.45)",
                  color: "#fff",
                  fontWeight: 600,
                  height: 38,
                  px: 0.9,
                  fontSize: "0.95rem"
                }}
              />
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  display: { xs: "none", md: "flex" },
                  ml: "auto"
                }}
              >
                {headerBadges.map((badge) => (
                  <ButtonBase
                    key={badge.name}
                    component="a"
                    href={badge.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 1,
                      px: 0.25,
                      py: 0.1
                    }}
                  >
                    <Box
                      component="img"
                      src={badge.logoSrc}
                      alt={badge.name}
                      sx={{
                        height: 62,
                        width: "auto",
                        maxWidth: 210,
                        objectFit: "contain",
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
                      }}
                    />
                  </ButtonBase>
                ))}
              </Stack>
              {isMobile && accountActions}
            </Stack>
          </Stack>
        </Box>
      </Box>
      </Box>

      {!isMobile && (
        <Menu
          anchorEl={servicesAnchorEl}
          open={servicesMenuOpen}
          onClose={() => setServicesAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          PaperProps={{
            sx: {
              mt: 0.8,
              minWidth: 420,
              borderRadius: 1.2,
              border: "1px solid #d5d5d5",
              boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
              overflow: "hidden"
            }
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 1,
              bgcolor: "#f2f7e8",
              borderBottom: "1px solid #c7d8ae",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          >
            <Typography sx={{ color: "#d8842d", fontWeight: 700 }}>{t("layout.services")}</Typography>
            <DragHandleIcon sx={{ color: "#9e7f3d", fontSize: 22 }} />
          </Box>
          <MenuItem sx={{ py: 1.35, fontSize: "1.12rem" }} onClick={() => handleServiceOpen("/services")}>
            {t("layout.service_map")}
          </MenuItem>
          <Divider />
          {serviceItems.map((item) => (
            <MenuItem key={item.path} sx={{ py: 1.35, fontSize: "1.12rem" }} onClick={() => handleServiceOpen(item.path)}>
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      )}

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
    </Box>
  );
};

export default AppLayout;
