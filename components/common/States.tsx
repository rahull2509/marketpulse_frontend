"use client";

import { Loader2, WifiOff, SearchX, BarChart3, CalendarOff, Clock, ScanSearch } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   Loading State
   ═══════════════════════════════════════════════════════════════ */

export function LoadingState({ message = "Loading data..." }: { message?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
      }}
    >
      <Loader2
        size={24}
        style={{ color: "var(--color-accent)", marginBottom: 12 }}
        className="animate-spin"
      />
      <p
        style={{
          fontSize: 13,
          color: "var(--text-tertiary)",
        }}
      >
        {message}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Error State
   ═══════════════════════════════════════════════════════════════ */

export function ErrorState({
  title = "Connection Issue",
  message = "Unable to reach the server. Retrying...",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--color-negative-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <WifiOff size={24} style={{ color: "var(--color-negative)" }} />
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          marginBottom: 20,
          maxWidth: 280,
        }}
      >
        {message}
      </p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Retry Connection
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════════════════════ */

export function EmptyState({
  icon: Icon = BarChart3,
  title = "No data available",
  message = "There is no data to display at the moment.",
  action,
  onAction,
}: {
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title?: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--bg-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <Icon size={24} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 4,
        }}
      >
        {title}
      </p>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          maxWidth: 280,
          marginBottom: action ? 20 : 0,
        }}
      >
        {message}
      </p>
      {action && onAction && (
        <button className="btn btn-secondary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Market Closed Banner
   ═══════════════════════════════════════════════════════════════ */

export function MarketClosedBanner({
  lastUpdated,
}: {
  lastUpdated?: string | null;
}) {
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="card"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-4)",
        padding: "var(--sp-3) var(--sp-4)",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "var(--color-closed)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Market Closed
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-tertiary)",
            marginLeft: 12,
          }}
        >
          {isWeekend ? "Weekend" : dateStr}
          {lastUpdated && ` · Last updated ${new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>
      <span className="badge badge-closed">
        {isWeekend ? "WEEKEND" : "CLOSED"}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Skeleton Table
   ═══════════════════════════════════════════════════════════════ */

export function SkeletonTable({ rows = 10, cols = 8 }: { rows?: number; cols?: number }) {
  return (
    <div className="table-container">
      <table className="market-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ height: 40 }}>
                <div className="skeleton" style={{ height: 10, width: i === 0 ? 80 : 56 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} style={{ height: 44 }}>
                  <div
                    className="skeleton"
                    style={{
                      height: 10,
                      width: colIdx === 0 ? 80 : colIdx < 3 ? 64 : 48,
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Skeleton Cards
   ═══════════════════════════════════════════════════════════════ */

export function SkeletonCards({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "flex", gap: "var(--sp-3)" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="card-compact"
          style={{ minWidth: 120 }}
        >
          <div className="skeleton" style={{ width: 60, height: 8, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 80, height: 16 }} />
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Skeleton Toolbar
   ═══════════════════════════════════════════════════════════════ */

export function SkeletonToolbar() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
        <div className="skeleton" style={{ width: 240, height: 36, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton" style={{ width: 80, height: 14 }} />
      </div>
      <div style={{ display: "flex", gap: "var(--sp-2)" }}>
        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton" style={{ width: 60, height: 32, borderRadius: "var(--radius-sm)" }} />
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)" }} />
      </div>
    </div>
  );
}
