import React, { useEffect, useMemo, useState } from "react";
import {
  alpha,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ForumIcon from "@mui/icons-material/Forum";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";
import { createTicket, fetchTickets, replyTicket, updateTicketStatus } from "../services/tickets";
import { useAppSelector } from "../store/hooks";

const formatDateTime = (value: string) => new Date(value).toLocaleString();

const HelpdeskPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role;
  const isStaff = userRole === "extension_officer" || userRole === "admin";
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [scope, setScope] = useState(isStaff ? "assigned" : "");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isStaff && !scope) {
      setScope("assigned");
    }
  }, [isStaff, scope]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets", statusFilter, scope],
    queryFn: () =>
      fetchTickets({
        limit: 50,
        status: statusFilter || undefined,
        scope: isStaff ? scope : undefined,
      }),
  });

  const tickets = data?.items ?? [];
  const featuredTicket = tickets[0] ?? null;

  const queueStats = useMemo(
    () => [
      {
        label: "Open tickets",
        value: tickets.filter((ticket) => ticket.status === "open").length,
        accent: "#9b3d20",
        icon: <AssignmentLateIcon />,
      },
      {
        label: "In progress",
        value: tickets.filter((ticket) => ticket.status === "in_progress").length,
        accent: "#8f6a23",
        icon: <ForumIcon />,
      },
      {
        label: "Resolved and closed",
        value: tickets.filter(
          (ticket) => ticket.status === "resolved" || ticket.status === "closed",
        ).length,
        accent: "#1f6d45",
        icon: <CheckCircleOutlineIcon />,
      },
      {
        label: "Conversation updates",
        value: tickets.reduce((total, ticket) => total + ticket.messages.length, 0),
        accent: "#2f7c88",
        icon: <ChatBubbleOutlineIcon />,
      },
    ],
    [tickets],
  );

  const supportLanes = [
    {
      title: "Field issue intake",
      note: "Capture crop, mandi, and service problems before they affect decisions.",
    },
    {
      title: "Officer response lane",
      note: "Assign and resolve operational tickets with clean status transitions.",
    },
    {
      title: "Closure and learning",
      note: "Use replies and closures as a loop-back signal for product and service quality.",
    },
  ];

  const statusTone = (value: string) => {
    if (value === "resolved" || value === "closed") return "success";
    if (value === "in_progress") return "warning";
    return "default";
  };

  const handleSubmit = async () => {
    if (!subject || !body) return;
    setSubmitting(true);
    try {
      await createTicket({ subject, body, category: category || undefined });
      setSubject("");
      setBody("");
      setCategory("");
      await queryClient.invalidateQueries({ queryKey: ["tickets"] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    const replyBody = replyDrafts[ticketId];
    if (!replyBody) return;
    await replyTicket(ticketId, replyBody);
    setReplyDrafts((prev) => ({ ...prev, [ticketId]: "" }));
    await queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };

  const handleStatusUpdate = async (ticketId: string) => {
    const statusValue = statusDrafts[ticketId];
    if (!statusValue) return;
    await updateTicketStatus(ticketId, statusValue);
    await queryClient.invalidateQueries({ queryKey: ["tickets"] });
  };

  const statusLabel = (value: string) => t(`status.${value}`, { defaultValue: value });

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<SupportAgentIcon color="primary" />}
          logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
          title={t("helpdesk_page.title", { defaultValue: "Helpdesk + Ticketing" })}
          subtitle="A support command center for farmer issues, officer responses, and service recovery workflows across crop, market, and advisory operations."
          badges={[
            isStaff ? "Response queue" : "Farmer support desk",
            "Ticket-led workflow",
            "Escalation ready",
            "Status-tracked responses",
          ]}
          imageSrc="/assets/agri-slider/slide-08.jpg"
        />

        <Grid container spacing={2.2}>
          {queueStats.map((stat) => (
            <Grid item xs={12} sm={6} lg={3} key={stat.label}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: `1px solid ${alpha(stat.accent, 0.18)}`,
                  background: isDark
                    ? `linear-gradient(145deg, ${alpha(stat.accent, 0.14)} 0%, rgba(13, 28, 18, 0.92) 100%)`
                    : `linear-gradient(145deg, ${alpha(stat.accent, 0.08)} 0%, rgba(255,255,255,0.94) 100%)`,
                }}
              >
                <Stack direction="row" justifyContent="space-between" spacing={1.2}>
                  <Box>
                    <Typography variant="caption" sx={{ color: stat.accent, fontWeight: 800 }}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h5" sx={{ mt: 0.8, fontWeight: 800 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: 2,
                      bgcolor: alpha(stat.accent, 0.12),
                      color: stat.accent,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={7.5}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid rgba(31, 84, 50, 0.14)",
                background: isDark
                  ? "linear-gradient(145deg, rgba(16, 41, 28, 0.95) 0%, rgba(12, 29, 21, 0.95) 100%)"
                  : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(244,250,244,0.96) 100%)",
              }}
            >
              <CardContent sx={{ p: 2.8 }}>
                <Stack spacing={2.2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
                      Support intake
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {t("helpdesk_page.submit_ticket", { defaultValue: "Submit a Ticket" })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                      Capture the issue once and route it into the correct operational lane with
                      subject, category, and field context.
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label={t("helpdesk_page.subject", { defaultValue: "Subject" })}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        select
                        label={t("helpdesk_page.category", { defaultValue: "Category" })}
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <MenuItem value="">General support</MenuItem>
                        <MenuItem value="advisory">Advisory</MenuItem>
                        <MenuItem value="market">Market intelligence</MenuItem>
                        <MenuItem value="disease">Disease detection</MenuItem>
                        <MenuItem value="portal">Portal access</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label={t("helpdesk_page.describe_issue", {
                          defaultValue: "Describe the issue",
                        })}
                        multiline
                        minRows={4}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.2}
                        alignItems={{ xs: "stretch", sm: "center" }}
                      >
                        <Button
                          variant="contained"
                          onClick={handleSubmit}
                          disabled={submitting}
                          sx={{ fontWeight: 700 }}
                        >
                          {submitting
                            ? t("helpdesk_page.submitting", { defaultValue: "Submitting..." })
                            : t("helpdesk_page.submit_ticket_button", {
                                defaultValue: "Submit Ticket",
                              })}
                        </Button>
                        <Typography variant="caption" color="text.secondary">
                          Tickets stay visible in your queue until resolved or closed by staff.
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4.5}>
            <Card
              sx={{
                borderRadius: 3,
                border: "1px solid rgba(31, 84, 50, 0.14)",
                background: isDark
                  ? "linear-gradient(145deg, rgba(13, 33, 23, 0.95) 0%, rgba(10, 24, 17, 0.95) 100%)"
                  : "linear-gradient(145deg, rgba(250,254,249,0.98) 0%, rgba(239,247,239,0.96) 100%)",
              }}
            >
              <CardContent sx={{ p: 2.6 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
                      Response lanes
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      How this support desk flows
                    </Typography>
                  </Box>
                  {supportLanes.map((lane, index) => (
                    <Paper
                      key={lane.title}
                      elevation={0}
                      sx={{
                        p: 1.6,
                        borderRadius: 2.5,
                        border: "1px solid rgba(31, 84, 50, 0.12)",
                        bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
                      }}
                    >
                      <Stack direction="row" spacing={1.2} alignItems="flex-start">
                        <Chip
                          size="small"
                          label={`0${index + 1}`}
                          sx={{ borderRadius: 999, fontWeight: 800 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                            {lane.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                            {lane.note}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))}
                  <Divider />
                  <Typography variant="body2" color="text.secondary">
                    {isStaff
                      ? "Use the staff scope and status controls below to keep support actions moving."
                      : "Track replies, add updates, and keep the ticket body specific to crop, mandi, or portal issues."}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(31, 84, 50, 0.14)",
            background: isDark
              ? "linear-gradient(145deg, rgba(14, 35, 24, 0.96) 0%, rgba(10, 27, 19, 0.96) 100%)"
              : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(244,249,242,0.96) 100%)",
          }}
        >
          <CardContent sx={{ p: 2.4 }}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {isStaff
                    ? t("helpdesk_page.ticket_queue", { defaultValue: "Ticket Queue" })
                    : t("helpdesk_page.your_tickets", { defaultValue: "Your Tickets" })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
                  Filter the active support stream by ownership and status before opening a
                  conversation.
                </Typography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.3}>
                {isStaff && (
                  <TextField
                    select
                    size="small"
                    label={t("helpdesk_page.scope", { defaultValue: "Scope" })}
                    value={scope}
                    onChange={(event) => setScope(event.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="assigned">{statusLabel("assigned")}</MenuItem>
                    <MenuItem value="all">{statusLabel("all")}</MenuItem>
                  </TextField>
                )}
                <TextField
                  select
                  size="small"
                  label={t("helpdesk_page.status", { defaultValue: "Status" })}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="">{statusLabel("all")}</MenuItem>
                  <MenuItem value="open">{statusLabel("open")}</MenuItem>
                  <MenuItem value="in_progress">{statusLabel("in_progress")}</MenuItem>
                  <MenuItem value="resolved">{statusLabel("resolved")}</MenuItem>
                  <MenuItem value="closed">{statusLabel("closed")}</MenuItem>
                </TextField>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {isLoading && (
          <Typography>
            {t("helpdesk_page.loading", { defaultValue: "Loading tickets..." })}
          </Typography>
        )}
        {error && <Alert severity="error">{t("common.request_failed")}</Alert>}

        {featuredTicket && (
          <Paper
            elevation={0}
            sx={{
              p: 2.6,
              borderRadius: 3,
              border: "1px solid rgba(31, 84, 50, 0.14)",
              background: isDark
                ? "linear-gradient(145deg, rgba(16, 41, 28, 0.96) 0%, rgba(12, 31, 22, 0.96) 100%)"
                : "linear-gradient(145deg, rgba(245,250,243,0.98) 0%, rgba(255,255,255,0.98) 100%)",
            }}
          >
            <Grid container spacing={2.4}>
              <Grid item xs={12} lg={7.5}>
                <Stack spacing={1.1}>
                  <Typography variant="overline" sx={{ color: "primary.main", fontWeight: 800 }}>
                    Featured support thread
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {featuredTicket.subject}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {featuredTicket.body}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    <Chip
                      size="small"
                      label={statusLabel(featuredTicket.status)}
                      color={statusTone(featuredTicket.status)}
                    />
                    {featuredTicket.category && (
                      <Chip size="small" label={featuredTicket.category} variant="outlined" />
                    )}
                    <Chip
                      size="small"
                      label={`${featuredTicket.messages.length} replies`}
                      variant="outlined"
                    />
                  </Stack>
                </Stack>
              </Grid>
              <Grid item xs={12} lg={4.5}>
                <Stack spacing={1.2}>
                  <Paper
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#1f6d45", 0.08) }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Last updated
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {formatDateTime(featuredTicket.updated_at)}
                    </Typography>
                  </Paper>
                  <Paper
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#2f7c88", 0.08) }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Latest activity
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {featuredTicket.messages[featuredTicket.messages.length - 1]?.body ||
                        "Awaiting the next response."}
                    </Typography>
                  </Paper>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Grid container spacing={2.4}>
          {tickets.map((ticket) => (
            <Grid item xs={12} md={6} key={ticket._id}>
              <Card
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  border: "1px solid rgba(31, 84, 50, 0.14)",
                  background: isDark
                    ? "linear-gradient(145deg, rgba(13, 34, 23, 0.96) 0%, rgba(10, 25, 18, 0.96) 100%)"
                    : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(246,250,245,0.96) 100%)",
                }}
              >
                <CardContent sx={{ p: 2.4 }}>
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      spacing={1.5}
                      alignItems="flex-start"
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>
                          {ticket.subject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {ticket.body}
                        </Typography>
                      </Box>
                      <Chip
                        label={statusLabel(ticket.status)}
                        color={statusTone(ticket.status)}
                        size="small"
                      />
                    </Stack>

                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {ticket.category && (
                        <Chip size="small" variant="outlined" label={ticket.category} />
                      )}
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={<MarkEmailUnreadIcon />}
                        label={`${ticket.messages.length} replies`}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        icon={<TaskAltIcon />}
                        label={formatDateTime(ticket.updated_at)}
                      />
                    </Stack>

                    {ticket.messages.length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{ p: 1.5, borderRadius: 2.5, bgcolor: alpha("#1f6d45", 0.07) }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Latest reply
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {ticket.messages[ticket.messages.length - 1].body}
                        </Typography>
                      </Paper>
                    )}

                    <Stack spacing={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label={t("helpdesk_page.add_reply", { defaultValue: "Add a reply" })}
                        value={replyDrafts[ticket._id] || ""}
                        onChange={(event) =>
                          setReplyDrafts((prev) => ({ ...prev, [ticket._id]: event.target.value }))
                        }
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleReply(ticket._id)}
                        sx={{ fontWeight: 700 }}
                      >
                        {t("helpdesk_page.send_reply", { defaultValue: "Send Reply" })}
                      </Button>
                    </Stack>

                    {isStaff && (
                      <>
                        <Divider />
                        <Stack spacing={1}>
                          <TextField
                            select
                            size="small"
                            label={t("helpdesk_page.update_status", {
                              defaultValue: "Update status",
                            })}
                            value={statusDrafts[ticket._id] || ticket.status}
                            onChange={(event) =>
                              setStatusDrafts((prev) => ({
                                ...prev,
                                [ticket._id]: event.target.value,
                              }))
                            }
                          >
                            <MenuItem value="open">{statusLabel("open")}</MenuItem>
                            <MenuItem value="in_progress">{statusLabel("in_progress")}</MenuItem>
                            <MenuItem value="resolved">{statusLabel("resolved")}</MenuItem>
                            <MenuItem value="closed">{statusLabel("closed")}</MenuItem>
                          </TextField>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleStatusUpdate(ticket._id)}
                            sx={{ fontWeight: 700 }}
                          >
                            {t("helpdesk_page.update_status_button", {
                              defaultValue: "Update Status",
                            })}
                          </Button>
                        </Stack>
                      </>
                    )}
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

export default HelpdeskPage;
