export const MARKET = {
  OPEN_HOUR: 9,
  OPEN_MINUTE: 0,
  CLOSE_HOUR: 15,
  CLOSE_MINUTE: 30,
  TIMEZONE: "Asia/Kolkata",
} as const;

export const PAGE_SIZES = [25, 50, 100, 250, 500] as const;
export const DEFAULT_PAGE_SIZE = 50;

export const REFRESH_INTERVALS = {
  MARKET_STATUS: 30_000,   // 30 seconds
  INDICES: 60_000,         // 1 minute
  DASHBOARD: 15_000,       // 15 seconds (frequent polling alongside WebSocket)
} as const;

export const WS_RECONNECT = {
  INITIAL_DELAY: 1000,
  MAX_DELAY: 30_000,
  MULTIPLIER: 2,
} as const;
