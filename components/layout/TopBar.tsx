"use client";

import { useMarketStore } from "@/stores/market";
import { useWebSocketStore } from "@/stores/websocket";
import { BADGE_COLORS } from "@/constants/colors";

export function TopBar({ title }: { title: string }) {
  const { marketStatus, lastUpdated, cacheInfo } = useMarketStore();
  const wsStatus = useWebSocketStore((s) => s.status);

  const statusKey = marketStatus?.status || "CLOSED";
  const badgeColor = BADGE_COLORS[statusKey] || BADGE_COLORS.CLOSED;

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between border-b px-6 py-3"
      style={{
        backgroundColor: "var(--bg-secondary)",
        borderColor: "var(--border-primary)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-4">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>

        {/* Market Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor.bg} ${badgeColor.text}`}
        >
          {statusKey === "LIVE" && <span className="live-dot" style={{ width: 6, height: 6 }} />}
          {statusKey}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
        {cacheInfo && (
          <span>{cacheInfo.total_instruments.toLocaleString("en-IN")} instruments</span>
        )}
        {lastUpdated && (
          <span>
            Updated{" "}
            {lastUpdated.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
        {wsStatus === "connected" && (
          <span className="flex items-center gap-1">
            <span className="live-dot" style={{ width: 5, height: 5 }} />
            Live
          </span>
        )}
      </div>
    </header>
  );
}
