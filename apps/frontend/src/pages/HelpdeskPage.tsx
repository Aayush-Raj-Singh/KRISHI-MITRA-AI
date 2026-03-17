import React, { useEffect, useState } from "react";
import { Button, Card, CardContent, Grid, Stack, TextField, Typography, Chip, MenuItem } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import { createTicket, fetchTickets, replyTicket, updateTicketStatus } from "../services/tickets";
import { useAppSelector } from "../store/hooks";

const HelpdeskPage: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const userRole = useAppSelector((state) => state.auth.user?.role);
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
        scope: isStaff ? scope : undefined
      })
  });

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
        <Typography variant="h4">{t("helpdesk_page.title", { defaultValue: "Helpdesk + Ticketing" })}</Typography>

        <Card sx={{ border: "1px solid #e7ddcc" }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t("helpdesk_page.submit_ticket", { defaultValue: "Submit a Ticket" })}
            </Typography>
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
                  label={t("helpdesk_page.category", { defaultValue: "Category" })}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t("helpdesk_page.describe_issue", { defaultValue: "Describe the issue" })}
                  multiline
                  minRows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                  {submitting
                    ? t("helpdesk_page.submitting", { defaultValue: "Submitting..." })
                    : t("helpdesk_page.submit_ticket_button", { defaultValue: "Submit Ticket" })}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "flex-start", md: "center" }}>
          <Typography variant="h6">
            {isStaff
              ? t("helpdesk_page.ticket_queue", { defaultValue: "Ticket Queue" })
              : t("helpdesk_page.your_tickets", { defaultValue: "Your Tickets" })}
          </Typography>
          <Stack direction="row" spacing={2}>
            {isStaff && (
              <TextField
                select
                size="small"
                label={t("helpdesk_page.scope", { defaultValue: "Scope" })}
                value={scope}
                onChange={(event) => setScope(event.target.value)}
                sx={{ minWidth: 140 }}
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
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">{statusLabel("all")}</MenuItem>
              <MenuItem value="open">{statusLabel("open")}</MenuItem>
              <MenuItem value="in_progress">{statusLabel("in_progress")}</MenuItem>
              <MenuItem value="resolved">{statusLabel("resolved")}</MenuItem>
              <MenuItem value="closed">{statusLabel("closed")}</MenuItem>
            </TextField>
          </Stack>
        </Stack>
        {isLoading && <Typography>{t("helpdesk_page.loading", { defaultValue: "Loading tickets..." })}</Typography>}
        {error && <Typography color="error">{t("common.request_failed")}</Typography>}
        <Grid container spacing={2}>
          {data?.items.map((ticket) => (
            <Grid item xs={12} md={6} key={ticket._id}>
              <Card sx={{ border: "1px solid #ece0cf" }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1">{ticket.subject}</Typography>
                    <Chip label={statusLabel(ticket.status)} size="small" />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {ticket.body}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("helpdesk_page.updated", { defaultValue: "Updated" })}: {new Date(ticket.updated_at).toLocaleString()}
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("helpdesk_page.add_reply", { defaultValue: "Add a reply" })}
                      value={replyDrafts[ticket._id] || ""}
                      onChange={(event) =>
                        setReplyDrafts((prev) => ({ ...prev, [ticket._id]: event.target.value }))
                      }
                    />
                    <Button variant="outlined" size="small" onClick={() => handleReply(ticket._id)}>
                      {t("helpdesk_page.send_reply", { defaultValue: "Send Reply" })}
                    </Button>
                  </Stack>
                  {isStaff && (
                    <Stack spacing={1} sx={{ mt: 2 }}>
                      <TextField
                        select
                        size="small"
                        label={t("helpdesk_page.update_status", { defaultValue: "Update status" })}
                        value={statusDrafts[ticket._id] || ticket.status}
                        onChange={(event) =>
                          setStatusDrafts((prev) => ({ ...prev, [ticket._id]: event.target.value }))
                        }
                      >
                        <MenuItem value="open">{statusLabel("open")}</MenuItem>
                        <MenuItem value="in_progress">{statusLabel("in_progress")}</MenuItem>
                        <MenuItem value="resolved">{statusLabel("resolved")}</MenuItem>
                        <MenuItem value="closed">{statusLabel("closed")}</MenuItem>
                      </TextField>
                      <Button variant="contained" size="small" onClick={() => handleStatusUpdate(ticket._id)}>
                        {t("helpdesk_page.update_status_button", { defaultValue: "Update Status" })}
                      </Button>
                    </Stack>
                  )}
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
