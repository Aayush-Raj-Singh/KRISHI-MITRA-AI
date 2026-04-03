import { useEffect, useMemo, useState } from "react";

import { resolveWsUrl } from "../../../services/runtimeConfig";
import { useTranslatedStrings } from "../../../utils/useTranslatedStrings";
import { useWebSocket } from "../../../utils/useWebSocket";

export interface DashboardRealtimeEvent {
  id: string;
  summary: string;
  time: string;
  severity?: "info" | "success" | "warning";
}

const useDashboardRealtime = (accessToken?: string | null) => {
  const wsBaseUrl = resolveWsUrl(import.meta.env.VITE_WS_URL as string | undefined);
  const wsUrl = accessToken ? wsBaseUrl : undefined;
  const wsAuthMessage = accessToken
    ? JSON.stringify({ type: "auth", token: accessToken })
    : undefined;
  const { status: wsStatus, lastEvent } = useWebSocket(wsUrl, wsAuthMessage);
  const [realtimeEvents, setRealtimeEvents] = useState<DashboardRealtimeEvent[]>([]);
  const realtimeCopy = useTranslatedStrings(
    useMemo(
      () => ({
        eventFallback: "event",
        operationPrefix: "Operation",
        scheduled: "scheduled",
        triggered: "triggered",
        feedbackRecorded: "Outcome feedback recorded",
        quickRatingReceived: "Quick rating received for",
        serviceFallback: "service",
        realtimeConnected: "Realtime channel connected",
      }),
      [],
    ),
  );

  useEffect(() => {
    if (!lastEvent || typeof lastEvent !== "object") return;
    const eventType = String(lastEvent.event || "");
    const timestamp = String(
      lastEvent.server_time || lastEvent.triggered_at || new Date().toISOString(),
    );

    let summary = eventType || realtimeCopy.eventFallback;
    let severity: "info" | "success" | "warning" = "info";
    if (eventType.startsWith("operation")) {
      const operation = String(lastEvent.operation || "");
      summary = `${realtimeCopy.operationPrefix} ${operation.replace(/_/g, " ")} ${
        eventType.includes("scheduled") ? realtimeCopy.scheduled : realtimeCopy.triggered
      }`;
      severity = "success";
    } else if (eventType === "feedback.submitted") {
      summary = `${realtimeCopy.feedbackRecorded} (rating ${String(lastEvent.rating || "-")})`;
      severity = "info";
    } else if (eventType === "feedback.quick_submitted") {
      summary = `${realtimeCopy.quickRatingReceived} ${String(lastEvent.service || realtimeCopy.serviceFallback)}`;
      severity = "info";
    } else if (eventType === "connected") {
      summary = realtimeCopy.realtimeConnected;
      severity = "success";
    }

    const nextId = `${eventType}-${timestamp}`;
    setRealtimeEvents((prev) =>
      [
        { id: nextId, summary, time: timestamp, severity },
        ...prev.filter((item) => item.id !== nextId),
      ].slice(0, 6),
    );
  }, [lastEvent, realtimeCopy]);

  return {
    wsStatus,
    wsUrl,
    realtimeEvents,
  };
};

export default useDashboardRealtime;
