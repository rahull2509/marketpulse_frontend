export const COLORS = {
  positive: "var(--color-positive)",
  negative: "var(--color-negative)",
  neutral: "var(--color-neutral)",
  accent: "var(--color-accent)",
  warning: "var(--color-warning)",
  info: "var(--color-info)",
} as const;

export const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  LIVE: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  CLOSED: { bg: "bg-red-500/10", text: "text-red-400" },
  HOLIDAY: { bg: "bg-amber-500/10", text: "text-amber-400" },
  WEEKEND: { bg: "bg-slate-500/10", text: "text-slate-400" },
  BULLISH: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
  BEARISH: { bg: "bg-red-500/10", text: "text-red-400" },
  HIGH_VOLUME: { bg: "bg-blue-500/10", text: "text-blue-400" },
  CONNECTING: { bg: "bg-amber-500/10", text: "text-amber-400" },
  DISCONNECTED: { bg: "bg-red-500/10", text: "text-red-400" },
};
