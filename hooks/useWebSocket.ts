/**
 * useWebSocket — Manages WebSocket connection lifecycle.
 *
 * Features:
 * - Automatic connection on mount
 * - Exponential backoff reconnection
 * - Delta update integration with market store
 * - Heartbeat handling
 * - Clean disconnect on unmount
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMarketStore } from "@/stores/market";
import { useWebSocketStore } from "@/stores/websocket";
import { WS_RECONNECT } from "@/constants/market";
import type { StockRecord } from "@/types/stock";

const WS_URL =
  typeof window !== "undefined"
    ? `ws://${window.location.hostname}:8000/api/v1/ws`
    : "";

interface WSMessage {
  type: string;
  changed_rows?: StockRecord[];
  snapshot_id?: number;
  total_instruments?: number;
  market_status?: string;
  [key: string]: unknown;
}

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setStatus, incrementReconnect, resetReconnect, reconnectAttempts } =
    useWebSocketStore();
  const { applyDelta, setMarketStatus: setMarketStatusInStore } = useMarketStore();

  const connect = useCallback(() => {
    if (typeof window === "undefined" || !WS_URL) return;

    // Don't create another connection if one exists
    if (
      socketRef.current?.readyState === WebSocket.OPEN ||
      socketRef.current?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    setStatus("connecting");

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      resetReconnect();
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);

        switch (msg.type) {
          case "connected":
            // Initial connection ack
            break;

          case "snapshot_update":
            if (msg.changed_rows?.length) {
              applyDelta(msg.changed_rows);
            }
            break;

          case "market_closed":
            // Could update market status in store
            break;

          case "heartbeat":
            // Keepalive — no action needed
            break;

          case "pong":
            break;

          default:
            break;
        }
      } catch {
        // Invalid JSON — ignore
      }
    };

    ws.onerror = () => {
      setStatus("error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
      socketRef.current = null;
      scheduleReconnect();
    };
  }, [setStatus, resetReconnect, applyDelta, setMarketStatusInStore]);

  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(
      WS_RECONNECT.INITIAL_DELAY * Math.pow(WS_RECONNECT.MULTIPLIER, reconnectAttempts),
      WS_RECONNECT.MAX_DELAY
    );

    reconnectTimerRef.current = setTimeout(() => {
      incrementReconnect();
      connect();
    }, delay);
  }, [reconnectAttempts, incrementReconnect, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setStatus("disconnected");
  }, [setStatus]);

  const sendMessage = useCallback((data: Record<string, unknown>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connect, disconnect, sendMessage };
}
