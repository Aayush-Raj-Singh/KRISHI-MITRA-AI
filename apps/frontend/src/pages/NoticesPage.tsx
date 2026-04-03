import React, { useMemo } from "react";
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
import CampaignIcon from "@mui/icons-material/Campaign";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import HubIcon from "@mui/icons-material/Hub";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PushPinIcon from "@mui/icons-material/PushPin";
import InsightsIcon from "@mui/icons-material/Insights";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { DASHBOARD_GALLERY_IMAGES, IMPORTANT_LINKS } from "./dashboard/constants";

const NoticesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const notices = useMemo(
    () => [
      {
        title: t("dashboard_page.notices.item_1_title"),
        date: t("dashboard_page.notices.item_1_date"),
        category: t("dashboard_page.notices.priority_subsidy", { defaultValue: "Subsidy Window" }),
        tone: "success" as const,
        icon: <AccountBalanceIcon />,
        route: "/portal",
        insight: t("dashboard_page.notices.priority_subsidy_note", {
          defaultValue:
            "Direct benefit support is active. Verify eligibility and submit required seasonal records.",
        }),
      },
      {
        title: t("dashboard_page.notices.item_2_title"),
        date: t("dashboard_page.notices.item_2_date"),
        category: t("dashboard_page.notices.priority_procurement", { defaultValue: "Procurement" }),
        tone: "warning" as const,
        icon: <TrendingUpIcon />,
        route: "/services/market-intelligence?tab=arrivals",
        insight: t("dashboard_page.notices.priority_procurement_note", {
          defaultValue:
            "District schedules changed. Review nearby mandi arrival signals before dispatch planning.",
        }),
      },
      {
        title: t("dashboard_page.notices.item_3_title"),
        date: t("dashboard_page.notices.item_3_date"),
        category: t("dashboard_page.notices.priority_water", { defaultValue: "Water Advisory" }),
        tone: "info" as const,
        icon: <WaterDropIcon />,
        route: "/services/farm-operations?tab=water",
        insight: t("dashboard_page.notices.priority_water_note", {
          defaultValue:
            "Irrigation guidance is tuned for heat stress and lower canal availability this week.",
        }),
      },
      {
        title: t("dashboard_page.notices.item_4_title"),
        date: t("dashboard_page.notices.item_4_date"),
        category: t("dashboard_page.notices.priority_credit", { defaultValue: "Credit Access" }),
        tone: "secondary" as const,
        icon: <EventAvailableIcon />,
        route: "/helpdesk",
        insight: t("dashboard_page.notices.priority_credit_note", {
          defaultValue:
            "Farmer finance support is live. Keep land and crop details ready before applying.",
        }),
      },
    ],
    [t],
  );

  const quickActions = useMemo(
    () => [
      {
        label: t("dashboard_page.notices.action_advisory", { defaultValue: "Open Advisory Desk" }),
        caption: t("dashboard_page.notices.action_advisory_note", {
          defaultValue: "Ask for localized crop, irrigation, and disease recommendations.",
        }),
        route: "/advisory",
        icon: <HubIcon />,
        color: "#1f6d45",
      },
      {
        label: t("dashboard_page.notices.action_market", {
          defaultValue: "Review Market Bulletin",
        }),
        caption: t("dashboard_page.notices.action_market_note", {
          defaultValue: "Track mandi prices, arrivals, and trend movements before sale decisions.",
        }),
        route: "/services/market-intelligence?tab=price",
        icon: <InsightsIcon />,
        color: "#9a4c18",
      },
      {
        label: t("dashboard_page.notices.action_profile", {
          defaultValue: "Refresh Farmer Profile",
        }),
        caption: t("dashboard_page.notices.action_profile_note", {
          defaultValue:
            "Keep farm size, crops, and language updated for better portal recommendations.",
        }),
        route: "/profile",
        icon: <AgricultureIcon />,
        color: "#386641",
      },
      {
        label: t("dashboard_page.notices.action_helpdesk", { defaultValue: "Reach Helpdesk" }),
        caption: t("dashboard_page.notices.action_helpdesk_note", {
          defaultValue: "Escalate scheme, grievance, or support requests from one place.",
        }),
        route: "/helpdesk",
        icon: <SupportAgentIcon />,
        color: "#446f95",
      },
    ],
    [t],
  );

  const officialLinks = useMemo(
    () => [
      {
        label: t("dashboard_page.links.beneficiary_status"),
        href: IMPORTANT_LINKS[0]?.url ?? "https://pmkisan.gov.in/",
        icon: <CheckCircleIcon color="success" />,
      },
      {
        label: t("dashboard_page.links.farmer_registration"),
        href: IMPORTANT_LINKS[1]?.url ?? "https://farmer.gov.in/",
        icon: <AgricultureIcon sx={{ color: "#2e7d32" }} />,
      },
      {
        label: t("dashboard_page.links.market_price_bulletin"),
        href: IMPORTANT_LINKS[2]?.url ?? "https://agmarknet.gov.in/",
        icon: <TrendingUpIcon sx={{ color: "#b5541d" }} />,
      },
      {
        label: t("dashboard_page.links.helpline_support"),
        href: IMPORTANT_LINKS[3]?.url ?? "https://pgportal.gov.in/",
        icon: <LinkIcon sx={{ color: "#1f6d45" }} />,
      },
    ],
    [t],
  );

  const spotlightImages = useMemo(() => DASHBOARD_GALLERY_IMAGES.slice(0, 4), []);

  const statCards = useMemo(
    () => [
      {
        label: t("dashboard_page.notices.stat_live", { defaultValue: "Active notices" }),
        value: String(notices.length).padStart(2, "0"),
        tone: "#1f6d45",
      },
      {
        label: t("dashboard_page.notices.stat_focus", { defaultValue: "Priority focus" }),
        value: t("dashboard_page.notices.stat_focus_value", { defaultValue: "Rabi support" }),
        tone: "#a44a16",
      },
      {
        label: t("dashboard_page.notices.stat_response", { defaultValue: "Response lane" }),
        value: t("dashboard_page.notices.stat_response_value", {
          defaultValue: "Portal + field desk",
        }),
        tone: "#4a6382",
      },
    ],
    [notices.length, t],
  );

  const featuredNotice = notices[0];

  return (
    <AppLayout fullBleed>
      <Stack spacing={3.25}>
        <Paper
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 4,
            border: isDark
              ? "1px solid rgba(255,255,255,0.09)"
              : "1px solid rgba(69, 120, 72, 0.14)",
            background: isDark
              ? "linear-gradient(135deg, rgba(16, 38, 27, 0.98) 0%, rgba(22, 53, 35, 0.97) 48%, rgba(56, 87, 51, 0.94) 100%)"
              : "linear-gradient(135deg, rgba(251, 250, 241, 0.98) 0%, rgba(234, 244, 227, 0.98) 40%, rgba(214, 235, 205, 0.98) 100%)",
            boxShadow: isDark
              ? "0 20px 44px rgba(0,0,0,0.34)"
              : "0 22px 42px rgba(39, 84, 42, 0.14)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: isDark
                ? "radial-gradient(circle at 18% 18%, rgba(110, 214, 129, 0.12), transparent 42%), radial-gradient(circle at 82% 12%, rgba(255, 198, 112, 0.12), transparent 36%)"
                : "radial-gradient(circle at 18% 18%, rgba(67, 145, 80, 0.14), transparent 40%), radial-gradient(circle at 86% 14%, rgba(214, 144, 59, 0.14), transparent 34%)",
            }}
          />
          <Grid container spacing={0} sx={{ position: "relative" }}>
            <Grid item xs={12} lg={7.5}>
              <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.2 }}>
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: isDark ? alpha("#8fe388", 0.18) : alpha("#1f6d45", 0.1),
                      color: isDark ? "#9ff0a0" : "#1f6d45",
                    }}
                  >
                    <CampaignIcon />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="overline"
                      sx={{
                        color: isDark ? alpha("#f7f4df", 0.82) : alpha("#214c2a", 0.78),
                        letterSpacing: 1.4,
                        fontWeight: 800,
                      }}
                    >
                      {t("dashboard_page.notices.hero_kicker", {
                        defaultValue: "Seasonal notice command center",
                      })}
                    </Typography>
                    <Typography
                      variant="h2"
                      sx={{
                        fontFamily: "var(--app-heading-font), var(--app-body-font), serif",
                        fontWeight: 700,
                        lineHeight: 1.05,
                        fontSize: { xs: "2.2rem", md: "3.1rem" },
                        color: isDark ? "#f9f8ef" : "#1f3325",
                      }}
                    >
                      {t("dashboard_page.notices.title")}
                    </Typography>
                  </Box>
                </Stack>

                <Typography
                  variant="h6"
                  sx={{
                    maxWidth: 760,
                    color: isDark ? alpha("#f3f1e1", 0.88) : alpha("#294836", 0.86),
                    fontWeight: 500,
                    lineHeight: 1.6,
                    mb: 2.25,
                  }}
                >
                  {t("dashboard_page.notices.hero_subtitle", {
                    defaultValue:
                      "Track scheme windows, procurement changes, irrigation advisories, and field-support actions from one agriculture-first control room.",
                  })}
                </Typography>

                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 2.4 }}>
                  {notices.slice(0, 3).map((notice) => (
                    <Chip
                      key={notice.title}
                      icon={<CalendarMonthIcon sx={{ fontSize: 16 }} />}
                      label={`${notice.category} · ${notice.date}`}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 700,
                        bgcolor: isDark ? alpha("#ffffff", 0.09) : alpha("#ffffff", 0.72),
                        border: isDark
                          ? "1px solid rgba(255,255,255,0.12)"
                          : "1px solid rgba(31,109,69,0.1)",
                      }}
                    />
                  ))}
                </Stack>

                <Grid container spacing={1.5} sx={{ mb: 2.6 }}>
                  {statCards.map((card) => (
                    <Grid item xs={12} sm={4} key={card.label}>
                      <Paper
                        sx={{
                          p: 1.6,
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: isDark ? alpha("#ffffff", 0.08) : alpha(card.tone, 0.16),
                          background: isDark ? alpha("#ffffff", 0.04) : alpha("#ffffff", 0.76),
                        }}
                      >
                        <Typography
                          variant="overline"
                          sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}
                        >
                          {card.label}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: card.tone }}>
                          {card.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                  <Button
                    variant="contained"
                    color="secondary"
                    endIcon={<ArrowOutwardIcon />}
                    onClick={() => navigate(featuredNotice.route)}
                    sx={{
                      px: 2.4,
                      py: 1.15,
                      borderRadius: 999,
                      boxShadow: "0 12px 24px rgba(156, 84, 26, 0.18)",
                    }}
                  >
                    {t("dashboard_page.notices.primary_cta", {
                      defaultValue: "Open Priority Notice",
                    })}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/services/market-intelligence?tab=price")}
                    sx={{
                      px: 2.2,
                      py: 1.15,
                      borderRadius: 999,
                      borderColor: isDark ? alpha("#ffffff", 0.22) : alpha("#1f6d45", 0.22),
                      color: isDark ? "#f6f4eb" : "#1f6d45",
                    }}
                  >
                    {t("dashboard_page.notices.secondary_cta", {
                      defaultValue: "View market bulletin",
                    })}
                  </Button>
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} lg={4.5}>
              <Box
                sx={{
                  height: "100%",
                  p: { xs: 2.5, md: 3.2 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  background: isDark
                    ? "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(255,255,255,0.18))",
                  borderLeft: {
                    lg: isDark
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "1px solid rgba(50, 96, 54, 0.12)",
                  },
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    borderRadius: 3.2,
                    bgcolor: isDark ? alpha("#12311f", 0.88) : alpha("#ffffff", 0.78),
                    border: "1px solid",
                    borderColor: isDark ? alpha("#ffffff", 0.08) : alpha("#1f6d45", 0.12),
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.5}
                  >
                    <Box>
                      <Typography
                        variant="overline"
                        sx={{ color: "text.secondary", fontWeight: 700 }}
                      >
                        {t("dashboard_page.notices.featured_notice", {
                          defaultValue: "Featured notice",
                        })}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.2 }}>
                        {featuredNotice.title}
                      </Typography>
                    </Box>
                    <PushPinIcon sx={{ color: "#c66c2f" }} />
                  </Stack>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1.3, lineHeight: 1.7 }}
                  >
                    {featuredNotice.insight}
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1.6 }}>
                    <Chip
                      size="small"
                      label={featuredNotice.category}
                      sx={{
                        borderRadius: 999,
                        fontWeight: 700,
                        bgcolor: alpha("#1f6d45", 0.1),
                        color: "#1f6d45",
                      }}
                    />
                    <Chip
                      size="small"
                      label={featuredNotice.date}
                      sx={{ borderRadius: 999, fontWeight: 700 }}
                    />
                  </Stack>
                </Paper>

                <Grid container spacing={1.2}>
                  {spotlightImages.map((image) => (
                    <Grid item xs={6} key={image.src}>
                      <Paper
                        sx={{
                          overflow: "hidden",
                          borderRadius: 2.6,
                          border: "1px solid",
                          borderColor: isDark ? alpha("#ffffff", 0.08) : alpha("#1f6d45", 0.1),
                          boxShadow: isDark
                            ? "0 10px 24px rgba(0,0,0,0.24)"
                            : "0 10px 22px rgba(35, 69, 36, 0.12)",
                        }}
                      >
                        <Box
                          component="img"
                          src={image.src}
                          alt={image.alt}
                          sx={{ width: "100%", height: 118, objectFit: "cover", display: "block" }}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7.5}>
            <Stack spacing={3}>
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(38, 84, 41, 0.1)",
                  background: isDark
                    ? "linear-gradient(180deg, rgba(18, 34, 25, 0.96), rgba(12, 28, 20, 0.96))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,249,240,0.98))",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={1.5}
                    sx={{ mb: 2 }}
                  >
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>
                        {t("dashboard_page.notices.priority_title", {
                          defaultValue: "Priority field alerts",
                        })}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        {t("dashboard_page.notices.priority_description", {
                          defaultValue:
                            "High-importance updates that affect subsidy, market movement, irrigation planning, and support access.",
                        })}
                      </Typography>
                    </Box>
                    <Chip
                      icon={<CampaignIcon />}
                      label={t("dashboard_page.notices.priority_chip", {
                        defaultValue: "Action this week",
                      })}
                      color="secondary"
                      sx={{ borderRadius: 999, fontWeight: 700 }}
                    />
                  </Stack>
                  <Grid container spacing={1.5}>
                    {notices.map((notice) => (
                      <Grid item xs={12} md={6} key={notice.title}>
                        <Paper
                          elevation={0}
                          sx={{
                            height: "100%",
                            p: 2,
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: isDark ? alpha("#ffffff", 0.08) : alpha("#1f6d45", 0.1),
                            background: isDark ? alpha("#ffffff", 0.03) : alpha("#ffffff", 0.78),
                            transition:
                              "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
                            "&:hover": {
                              transform: "translateY(-3px)",
                              boxShadow: isDark
                                ? "0 14px 30px rgba(0,0,0,0.24)"
                                : "0 14px 28px rgba(37, 76, 41, 0.12)",
                              borderColor: alpha("#1f6d45", 0.25),
                            },
                          }}
                        >
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="flex-start"
                            spacing={1.25}
                          >
                            <Avatar
                              sx={{
                                width: 42,
                                height: 42,
                                bgcolor: isDark ? alpha("#8fd67f", 0.16) : alpha("#1f6d45", 0.1),
                                color:
                                  notice.tone === "warning"
                                    ? "#b7601d"
                                    : notice.tone === "secondary"
                                      ? "#7e3f95"
                                      : "#1f6d45",
                              }}
                            >
                              {notice.icon}
                            </Avatar>
                            <Chip
                              label={notice.date}
                              size="small"
                              sx={{ borderRadius: 999, fontWeight: 700 }}
                            />
                          </Stack>
                          <Typography
                            variant="subtitle1"
                            sx={{ mt: 1.4, fontWeight: 800, lineHeight: 1.35 }}
                          >
                            {notice.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.9, minHeight: 68, lineHeight: 1.65 }}
                          >
                            {notice.insight}
                          </Typography>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mt: 1.5 }}
                          >
                            <Chip
                              label={notice.category}
                              size="small"
                              sx={{
                                borderRadius: 999,
                                fontWeight: 800,
                                bgcolor: isDark ? alpha("#ffffff", 0.06) : alpha("#1f6d45", 0.08),
                                color: isDark ? "#eef4ea" : "#1f6d45",
                              }}
                            />
                            <Button
                              size="small"
                              endIcon={<ArrowOutwardIcon />}
                              onClick={() => navigate(notice.route)}
                            >
                              {t("dashboard_page.notices.open_notice", { defaultValue: "Open" })}
                            </Button>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 3.5,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(38, 84, 41, 0.1)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.8 } }}>
                  <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.8 }}>
                    <CampaignIcon color="secondary" />
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {t("dashboard_page.notices.timeline_title", {
                        defaultValue: "Notice timeline",
                      })}
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <List sx={{ p: 0 }}>
                    {notices.map((notice, index) => (
                      <ListItem
                        key={notice.title}
                        disableGutters
                        sx={{
                          alignItems: "flex-start",
                          py: 1.65,
                          borderBottom:
                            index === notices.length - 1
                              ? "none"
                              : `1px solid ${isDark ? alpha("#ffffff", 0.06) : alpha("#1f6d45", 0.08)}`,
                        }}
                        secondaryAction={
                          <Button size="small" onClick={() => navigate(notice.route)}>
                            {t("dashboard_page.notices.view_action", { defaultValue: "View" })}
                          </Button>
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: isDark ? alpha("#8fd67f", 0.14) : alpha("#1f6d45", 0.1),
                              color: "#1f6d45",
                            }}
                          >
                            <CheckCircleIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Stack
                              direction={{ xs: "column", sm: "row" }}
                              spacing={1}
                              alignItems={{ sm: "center" }}
                            >
                              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                                {notice.title}
                              </Typography>
                              <Chip
                                label={notice.category}
                                size="small"
                                sx={{ width: "fit-content", borderRadius: 999 }}
                              />
                            </Stack>
                          }
                          secondary={
                            <Box sx={{ mt: 0.55 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {notice.insight}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, color: "text.secondary" }}
                              >
                                {notice.date}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} lg={4.5}>
            <Stack spacing={3}>
              <Card
                sx={{
                  borderRadius: 3.5,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(38, 84, 41, 0.1)",
                  background: isDark
                    ? "linear-gradient(180deg, rgba(14, 27, 20, 0.98), rgba(17, 36, 25, 0.98))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,249,240,0.98))",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
                  <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.5 }}>
                    <HubIcon color="primary" />
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {t("dashboard_page.notices.action_desk_title", {
                        defaultValue: "Action desk",
                      })}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("dashboard_page.notices.action_desk_subtitle", {
                      defaultValue:
                        "Jump straight into the workflow that helps you respond to current notices.",
                    })}
                  </Typography>
                  <Stack spacing={1.25}>
                    {quickActions.map((action) => (
                      <Paper
                        key={action.label}
                        elevation={0}
                        sx={{
                          p: 1.45,
                          borderRadius: 3,
                          border: "1px solid",
                          borderColor: isDark ? alpha("#ffffff", 0.08) : alpha(action.color, 0.14),
                          background: isDark ? alpha("#ffffff", 0.03) : alpha("#ffffff", 0.72),
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="flex-start">
                          <Avatar
                            sx={{
                              bgcolor: alpha(action.color, 0.12),
                              color: action.color,
                              width: 42,
                              height: 42,
                            }}
                          >
                            {action.icon}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                              {action.label}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.35, mb: 1 }}
                            >
                              {action.caption}
                            </Typography>
                            <Button
                              size="small"
                              endIcon={<ArrowOutwardIcon />}
                              onClick={() => navigate(action.route)}
                            >
                              {t("dashboard_page.notices.launch_action", {
                                defaultValue: "Launch",
                              })}
                            </Button>
                          </Box>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Card
                sx={{
                  borderRadius: 3.5,
                  border: isDark
                    ? "1px solid rgba(255,255,255,0.08)"
                    : "1px solid rgba(38, 84, 41, 0.1)",
                }}
              >
                <CardContent sx={{ p: { xs: 2.2, md: 2.6 } }}>
                  <Stack direction="row" spacing={1.1} alignItems="center" sx={{ mb: 1.5 }}>
                    <LinkIcon color="secondary" />
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {t("dashboard_page.links.title")}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t("dashboard_page.notices.official_links_note", {
                      defaultValue:
                        "Official programme and market portals that complement the notices shown above.",
                    })}
                  </Typography>
                  <Stack spacing={1.2}>
                    {officialLinks.map((item) => (
                      <Button
                        key={item.label}
                        component="a"
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        variant="outlined"
                        startIcon={item.icon}
                        endIcon={<ArrowOutwardIcon />}
                        fullWidth
                        sx={{
                          justifyContent: "space-between",
                          px: 1.6,
                          py: 1.15,
                          borderRadius: 999,
                          textTransform: "none",
                          fontWeight: 800,
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default NoticesPage;
