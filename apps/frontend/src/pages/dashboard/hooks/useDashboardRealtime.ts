import { useEffect, useState } from "react";

import { resolveWsUrl } from "../../../services/runtimeConfig";
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
  const wsAuthMessage = accessToken ? JSON.stringify({ type: "auth", token: accessToken }) : undefined;
  const { status: wsStatus, lastEvent } = useWebSocket(wsUrl, wsAuthMessage);
  const [realtimeEvents, setRealtimeEvents] = useState<DashboardRealtimeEvent[]>([]);

  useEffect(() => {
    if (!lastEvent || typeof lastEvent !== "object") return;
    const eventType = String(lastEvent.event || "");
    const timestamp = String(lastEvent.server_time || lastEvent.triggered_at || new Date().toISOString());

    let summary = eventType || "event";
    let severity: "info" | "success" | "warning" = "info";
    if (eventType.startsWith("operation")) {
      const operation = String(lastEvent.operation || "");
      summary = `Operation ${operation.replace(/_/g, " ")} ${eventType.includes("scheduled") ? "scheduled" : "triggered"}`;
      severity = "success";
    } else if (eventType === "feedback.submitted") {
      summary = `Outcome feedback recorded (rating ${String(lastEvent.rating || "-")})`;
      severity = "info";
    } else if (eventType === "feedback.quick_submitted") {
      summary = `Quick rating received for ${String(lastEvent.service || "service")}`;
      severity = "info";
    } else if (eventType === "connected") {
      summary = "Realtime channel connected";
      severity = "success";
    }

    setRealtimeEvents((prev) => [{ id: `${eventType}-${timestamp}`, summary, time: timestamp, severity }, ...prev].slice(0, 6));
  }, [lastEvent]);

  return {
    wsStatus,
    wsUrl,
    realtimeEvents
  };
};

export default useDashboardRealtime;
