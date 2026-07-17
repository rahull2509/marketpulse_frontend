"use client";

import { useMarketStore } from "@/stores/market";
import { useWebSocketStore } from "@/stores/websocket";
import { formatCurrency, formatPercent } from "@/utils/format";
import { Search, Settings } from "lucide-react";
import Link from "next/link";
import type { IndexData } from "@/types/stock";

function IndexTicker({ index }: { index: IndexData }) {
  const isUp = index.direction === "up";
  const isDown = index.direction === "down";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        padding: "0 var(--sp-4)",
        borderRight: "1px solid var(--border-primary)",
        minWidth: 140,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {index.name}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          className="font-tabular"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {index.value !== null ? index.value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
        </span>
        <span
          className="font-tabular"
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: isUp
              ? "var(--color-positive)"
              : isDown
              ? "var(--color-negative)"
              : "var(--color-neutral)",
          }}
        >
          {index.change !== null
            ? `${index.change > 0 ? "+" : ""}${index.change.toFixed(2)}`
            : "—"}
          {index.change_pct !== null && (
            <span style={{ marginLeft: 2 }}>
              ({formatPercent(index.change_pct)})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

interface TopNavigationProps {
  title: string;
}

export function TopNavigation({ title }: TopNavigationProps) {
  const indices = useMarketStore((s) => s.indices);
  const marketStatusObj = useMarketStore((s) => s.marketStatus);
  const { status: wsStatus } = useWebSocketStore();
  const isConnected = wsStatus === "connected";

  const isLive = (marketStatusObj?.is_open ?? false) && isConnected;

  return (
    <header className="app-topnav">
      {/* Left — Page Title */}
      <div style={{ minWidth: 180, flexShrink: 0 }}>
        <h1
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            lineHeight: "24px",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Center — Index Ticker Tape */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          gap: 0,
        }}
      >
        {indices.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            {indices.slice(0, 4).map((idx) => (
              <IndexTicker key={idx.name} index={idx} />
            ))}

            {/* Market Status Badge */}
            <div style={{ padding: "0 var(--sp-4)" }}>
              {isLive ? (
                <span className="badge badge-live">
                  <span className="live-dot" />
                  LIVE
                </span>
              ) : (
                <span className="badge badge-closed">
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "var(--color-closed)",
                    }}
                  />
                  CLOSED
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right — Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          flexShrink: 0,
        }}
      >
        <Link
          href="/settings"
          className="btn btn-ghost btn-icon"
          title="Settings"
        >
          <Settings size={16} />
        </Link>
      </div>
    </header>
  );
}
