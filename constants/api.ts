// API configuration constants

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || `ws://${typeof window !== "undefined" ? window.location.host : "localhost:8000"}/api/v1/ws`;

export const ENDPOINTS = {
  DASHBOARD: `${API_BASE_URL}/dashboard`,
  STOCKS: `${API_BASE_URL}/stocks`,
  STOCK_DETAIL: (symbol: string) => `${API_BASE_URL}/stocks/${encodeURIComponent(symbol)}`,
  HISTORY: `${API_BASE_URL}/history`,
  HISTORY_DATES: `${API_BASE_URL}/history/dates`,
  HISTORY_TIMELINE: (symbol: string) => `${API_BASE_URL}/history/timeline/${encodeURIComponent(symbol)}`,
  METADATA: `${API_BASE_URL}/metadata`,
  COLUMNS: `${API_BASE_URL}/columns`,
  MARKET_STATUS: `${API_BASE_URL}/market-status`,
  INDICES: `${API_BASE_URL}/indices`,
  SCANNER: `${API_BASE_URL}/scanner`,
  SCANNER_PRESETS: `${API_BASE_URL}/scanner/presets`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;
