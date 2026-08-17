/**
 * WebSocket Store — Connection state and lifecycle management.
 *
 * The socket reference is stored here so that any component
 * can send messages without creating additional connections.
 */

import { create } from "zustand";

export type WSStatus = "connecting" | "connected" | "disconnected" | "error";

interface WebSocketState {
  status: WSStatus;
  socket: WebSocket | null;
  reconnectAttempts: number;
  lastMessage: unknown | null;
  messageQueue: Record<string, unknown>[];

  setStatus: (status: WSStatus) => void;
  setSocket: (socket: WebSocket | null) => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
  setLastMessage: (message: unknown) => void;
  sendMessage: (data: Record<string, unknown>) => void;
  flushQueue: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  status: "disconnected",
  socket: null,
  reconnectAttempts: 0,
  lastMessage: null,
  messageQueue: [],

  setStatus: (status) => set({ status }),
  setSocket: (socket) => set({ socket }),
  incrementReconnect: () =>
    set((state) => ({ reconnectAttempts: state.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
  setLastMessage: (message) => set({ lastMessage: message }),

  sendMessage: (data) => {
    const { socket, status } = get();
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
    } else {
      // Queue the message if socket is not ready
      set((state) => ({ messageQueue: [...state.messageQueue, data] }));
    }
  },

  flushQueue: () => {
    const { socket, messageQueue } = get();
    if (socket?.readyState === WebSocket.OPEN && messageQueue.length > 0) {
      messageQueue.forEach((msg) => socket.send(JSON.stringify(msg)));
      set({ messageQueue: [] });
    }
  },
}));
