import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { TicketListResponse } from "@krishimitra/shared";

import { FieldInput } from "../components/FieldInput";
import { InlineTabs } from "../components/InlineTabs";
import { PrimaryButton } from "../components/PrimaryButton";
import { ScreenShell } from "../components/ScreenShell";
import { SectionCard } from "../components/SectionCard";
import { supportApi } from "../services/api";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../theme";

export const HelpdeskScreen = () => {
  const role = useAuthStore((state) => state.user?.role);
  const isStaff = role === "extension_officer" || role === "admin";
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [scope, setScope] = useState(isStaff ? "assigned" : "");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [tickets, setTickets] = useState<TicketListResponse | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      const response = await supportApi.getTickets({
        limit: 50,
        status: statusFilter || undefined,
        scope: isStaff ? scope : undefined,
      });
      setTickets(response);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to load tickets.");
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [isStaff, scope, statusFilter]);

  const handleSubmit = async () => {
    if (!subject || !body) {
      setNotice("Subject and issue details are required.");
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      await supportApi.createTicket({ subject, body, category: category || undefined });
      setSubject("");
      setBody("");
      setCategory("");
      setNotice("Ticket submitted successfully.");
      await loadTickets();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to create a ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: string) => {
    if (!replyDrafts[ticketId]) {
      return;
    }
    try {
      await supportApi.replyTicket(ticketId, replyDrafts[ticketId]);
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: "" }));
      await loadTickets();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to send the reply.");
    }
  };

  const handleStatusUpdate = async (ticketId: string) => {
    const status = statusDrafts[ticketId];
    if (!status) {
      return;
    }
    try {
      await supportApi.updateTicketStatus(ticketId, { status });
      await loadTickets();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to update the ticket status.");
    }
  };

  return (
    <ScreenShell
      title="Helpdesk"
      subtitle="Ticket submission, replies, and queue filtering align with the same support workflow used on the web portal."
      eyebrow="Support"
      heroImageSource={require("../../assets/hero-slide-05.jpg")}
      heroBadges={["Ticket Queue", "Replies", "Status Workflow"]}
    >
      {notice ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{notice}</Text>
        </View>
      ) : null}

      <SectionCard
        title="Submit a ticket"
        subtitle="Raise issues and support requests without leaving the mobile app."
      >
        <FieldInput label="Subject" onChangeText={setSubject} value={subject} />
        <FieldInput label="Category" onChangeText={setCategory} value={category} />
        <FieldInput
          label="Describe the issue"
          multiline
          onChangeText={setBody}
          style={styles.multiline}
          value={body}
        />
        <PrimaryButton
          label={submitting ? "Submitting..." : "Submit ticket"}
          onPress={() => void handleSubmit()}
        />
      </SectionCard>

      <SectionCard
        title={isStaff ? "Ticket queue" : "Your tickets"}
        subtitle="Filter by status and respond inline, just like the web helpdesk queue."
      >
        {isStaff ? (
          <InlineTabs
            activeKey={scope}
            items={[
              { key: "assigned", label: "Assigned" },
              { key: "all", label: "All" },
            ]}
            onChange={setScope}
          />
        ) : null}
        <InlineTabs
          activeKey={statusFilter || "all"}
          items={[
            { key: "all", label: "All" },
            { key: "open", label: "Open" },
            { key: "in_progress", label: "In progress" },
            { key: "resolved", label: "Resolved" },
            { key: "closed", label: "Closed" },
          ]}
          onChange={(value) => setStatusFilter(value === "all" ? "" : value)}
        />

        <View style={styles.ticketList}>
          {tickets?.items.map((ticket) => (
            <View key={ticket._id} style={styles.ticketCard}>
              <Text style={styles.ticketTitle}>{ticket.subject}</Text>
              <Text style={styles.ticketMeta}>
                {ticket.status} • Updated {new Date(ticket.updated_at).toLocaleString()}
              </Text>
              <Text style={styles.ticketBody}>{ticket.body}</Text>
              <FieldInput
                label="Add a reply"
                onChangeText={(value) =>
                  setReplyDrafts((prev) => ({ ...prev, [ticket._id]: value }))
                }
                value={replyDrafts[ticket._id] || ""}
              />
              <PrimaryButton
                label="Send reply"
                onPress={() => void handleReply(ticket._id)}
                tone="secondary"
              />
              {isStaff ? (
                <>
                  <FieldInput
                    helperText="open, in_progress, resolved, or closed"
                    label="Update status"
                    onChangeText={(value) =>
                      setStatusDrafts((prev) => ({ ...prev, [ticket._id]: value }))
                    }
                    value={statusDrafts[ticket._id] || ticket.status}
                  />
                  <PrimaryButton
                    label="Update status"
                    onPress={() => void handleStatusUpdate(ticket._id)}
                  />
                </>
              ) : null}
            </View>
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
  },
  bannerText: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  ticketList: {
    gap: spacing.md,
  },
  ticketCard: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 16,
    padding: 12,
    gap: spacing.sm,
  },
  ticketTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
  ticketMeta: {
    color: colors.mutedText,
    fontSize: typography.caption,
  },
  ticketBody: {
    color: colors.text,
    fontSize: typography.caption,
    lineHeight: 18,
  },
});
