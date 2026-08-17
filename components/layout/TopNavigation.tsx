"use client";

import { useMarketStore } from "@/stores/market";
import { useWebSocketStore } from "@/stores/websocket";
import { formatCurrency, formatPercent } from "@/utils/format";
import { Search, Settings } from "lucide-react";
import Link from "next/link";

interface TopNavigationProps {
  title: string;
}

export function TopNavigation({ title }: TopNavigationProps) {
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

      {/* Center — Market Status */}
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
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
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
