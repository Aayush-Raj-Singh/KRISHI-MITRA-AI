import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

export const useWebSocket = (url?: string, initialMessage?: string) => {
  const [status, setStatus] = useState<WebSocketStatus>(url ? "connecting" : "idle");
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<Record<string, unknown> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url) {
      setStatus("idle");
      return;
    }
    let isMounted = true;
    const socket = new WebSocket(url);
    socketRef.current = socket;
    setStatus("connecting");

    socket.onopen = () => {
      if (isMounted) {
        setStatus("open");
        if (initialMessage) {
          socket.send(initialMessage);
        }
      }
    };
    socket.onmessage = (event) => {
      if (!isMounted) return;
      setLastMessage(event.data);
      try {
        const parsed = JSON.parse(event.data) as Record<string, unknown>;
        setLastEvent(parsed);
      } catch {
        setLastEvent(null);
      }
    };
    socket.onerror = () => {
      if (isMounted) setStatus("error");
    };
    socket.onclose = () => {
      if (isMounted) setStatus("closed");
    };

    return () => {
      isMounted = false;
      socket.close();
    };
  }, [url, initialMessage]);

  const sendMessage = useCallback((payload: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(payload);
    }
  }, []);

  return { status, lastMessage, lastEvent, sendMessage };
};
