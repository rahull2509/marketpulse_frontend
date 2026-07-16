/**
 * WebSocket Store — Connection state and lifecycle management.
 */

import { create } from "zustand";

export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketState {
  status: WSStatus;
  socket: WebSocket | null;
  reconnectAttempts: number;
  lastMessage: unknown | null;

  setStatus: (status: WSStatus) => void;
  setSocket: (socket: WebSocket | null) => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
  setLastMessage: (message: unknown) => void;
}

export const useWebSocketStore = create<WebSocketState>((set) => ({
  status: "disconnected",
  socket: null,
  reconnectAttempts: 0,
  lastMessage: null,

  setStatus: (status) => set({ status }),
  setSocket: (socket) => set({ socket }),
  incrementReconnect: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
  setLastMessage: (message) => set({ lastMessage: message }),
}));
