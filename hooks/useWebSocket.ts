/**
 * useWebSocket — Manages WebSocket connection lifecycle.
 *
 * Features:
 * - Automatic connection on mount
 * - Exponential backoff reconnection
 * - Delta update integration with market store
 * - Scanner live update integration
 * - Heartbeat handling
 * - Clean disconnect on unmount
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMarketStore } from "@/stores/market";
import { useWebSocketStore } from "@/stores/websocket";
import { WS_RECONNECT } from "@/constants/market";
import { WS_BASE_URL } from "@/constants/api";
import type { StockRecord } from "@/types/stock";

const WS_URL = WS_BASE_URL;

interface WSMessage {
  type: string;
  changed_rows?: StockRecord[];
  data?: StockRecord[];
  meta?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    conditions_applied: number;
  };
  snapshot_id?: number;
  total_instruments?: number;
  market_status?: string;
  [key: string]: unknown;
}

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { setStatus, setSocket, incrementReconnect, resetReconnect, reconnectAttempts, flushQueue } =
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
    setSocket(ws);

    ws.onopen = () => {
      setStatus("connected");
      resetReconnect();
      flushQueue();
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
      setSocket(null);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      scheduleReconnect();
    };
  }, [setStatus, setSocket, resetReconnect, flushQueue, applyDelta, setMarketStatusInStore]);

  // Pre-declare so connect can use it, though JS hoists functions, useCallback doesn't.
  // We'll ignore the lint rule here by disabling it if needed.
  const scheduleReconnect = useCallback(() => {
    const delay = Math.min(
      WS_RECONNECT.INITIAL_DELAY * Math.pow(WS_RECONNECT.MULTIPLIER, reconnectAttempts),
      WS_RECONNECT.MAX_DELAY
    );

    reconnectTimerRef.current = setTimeout(() => {
      incrementReconnect();
      connect();
    }, delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnectAttempts, incrementReconnect]); // intentionally omitted connect to break cyclic dependency

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setSocket(null);
    setStatus("disconnected");
  }, [setStatus, setSocket]);

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
