"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { fetchHealth } from "@/services/data";
import {
  Server,
  Database,
  Cloud,
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Zap,
  TrendingUp,
  Globe,
  Bell,
  Bookmark,
  Info,
  ExternalLink,
} from "lucide-react";

/* ── Status Badge ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase?.() || "";
  const isOk =
    normalized === "healthy" ||
    normalized === "ok" ||
    normalized === "connected" ||
    normalized === "active" ||
    normalized === "running";
  const isWarn =
    normalized === "degraded" || normalized === "connecting" || normalized === "slow";

  if (isOk) {
    return (
      <span className="badge badge-positive">
        <CheckCircle size={9} />
        {status}
      </span>
    );
  }
  if (isWarn) {
    return (
      <span
        className="badge"
        style={{
          color: "var(--color-warning)",
          backgroundColor: "var(--color-warning-bg)",
        }}
      >
        <AlertCircle size={9} />
        {status}
      </span>
    );
  }
  return (
    <span className="badge badge-negative">
      <XCircle size={9} />
      {status}
    </span>
  );
}

/* ── Health Row ──────────────────────────────────────────────── */

function HealthRow({
  icon: Icon,
  label,
  status,
  detail,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  status: string;
  detail?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "var(--sp-3) var(--sp-4)",
        borderBottom: "1px solid var(--border-primary)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-3)",
          flex: 1,
        }}
      >
        <Icon size={15} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
            {label}
          </p>
          {detail && (
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
              {detail}
            </p>
          )}
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

/* ── Section Header ──────────────────────────────────────────── */

function SectionHeader({ title }: { title: string }) {
  return (
    <h3
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--text-tertiary)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        marginBottom: "var(--sp-3)",
      }}
    >
      {title}
    </h3>
  );
}

/* ── Upcoming Feature Card ───────────────────────────────────── */

function UpcomingCard({
  icon: Icon,
  title,
  description,
  eta,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  title: string;
  description: string;
  eta: string;
}) {
  return (
    <div
      className="card"
      style={{
        padding: "var(--sp-4)",
        flex: "1 1 240px",
        minWidth: 200,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--sp-3)",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--color-accent-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} style={{ color: "var(--color-accent)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 2,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {title}
            </p>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "var(--text-muted)",
                backgroundColor: "var(--bg-tertiary)",
                padding: "2px 6px",
                borderRadius: "var(--radius-xs)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {eta}
            </span>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Cache Metrics ───────────────────────────────────────────── */

function CacheMetrics({
  instruments,
  columns,
  snapshotId,
  lastUpdated,
}: {
  instruments: number;
  columns: number;
  snapshotId: number;
  lastUpdated: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--sp-3)",
        flexWrap: "wrap",
        padding: "var(--sp-3) var(--sp-4)",
      }}
    >
      {[
        { label: "Instruments", value: instruments.toLocaleString("en-IN") },
        { label: "Columns", value: String(columns) },
        { label: "Snapshot ID", value: String(snapshotId) },
        {
          label: "Last Updated",
          value: lastUpdated
            ? new Date(lastUpdated).toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
        },
      ].map((item) => (
        <div key={item.label}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              display: "block",
              marginBottom: 2,
            }}
          >
            {item.label}
          </span>
          <span
            className="font-tabular"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetchHealth();
      return res.data || null;
    },
    refetchInterval: 30_000,
  });

  const health = healthQuery.data;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title="Settings" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="app-content"
        style={{ padding: "var(--sp-6)", maxWidth: 860 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-8)" }}>
          {/* System Health */}
          <div>
            <SectionHeader title="System Health" />
            <div className="card" style={{ overflow: "hidden" }}>
              {health ? (
                <>
                  <HealthRow
                    icon={Server}
                    label="Backend API"
                    status={health.backend}
                    detail="FastAPI application server"
                  />
                  <HealthRow
                    icon={Calendar}
                    label="Scheduler"
                    status={health.scheduler}
                    detail="APScheduler — live data polling every minute"
                  />
                  <HealthRow
                    icon={Database}
                    label="Live Cache"
                    status={health.cache.populated ? "Healthy" : "Empty"}
                    detail={health.cache.populated ? "In-memory store populated" : "Cache has no data yet"}
                  />
                  <HealthRow
                    icon={Cloud}
                    label="S3 Storage"
                    status={health.s3}
                    detail="Historical data persistence layer"
                  />
                  <HealthRow
                    icon={Activity}
                    label="Market Status"
                    status={health.market_status}
                    detail="NSE / BSE trading session"
                  />
                  {health.cache.populated && (
                    <CacheMetrics
                      instruments={health.cache.instruments}
                      columns={health.cache.columns}
                      snapshotId={health.cache.snapshot_id}
                      lastUpdated={health.cache.last_updated}
                    />
                  )}
                </>
              ) : healthQuery.isLoading ? (
                <div
                  style={{
                    padding: "var(--sp-5)",
                    textAlign: "center",
                    color: "var(--text-tertiary)",
                    fontSize: 13,
                  }}
                >
                  Checking system status...
                </div>
              ) : (
                <div
                  style={{
                    padding: "var(--sp-5)",
                    textAlign: "center",
                    color: "var(--color-negative)",
                    fontSize: 13,
                  }}
                >
                  Backend unreachable. Cannot fetch system health.
                </div>
              )}
            </div>
          </div>

          {/* Table Preferences */}
          <div>
            <SectionHeader title="Table Preferences" />
            <div
              className="card"
              style={{
                padding: "var(--sp-5)",
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-4)",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bookmark size={18} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 2 }}>
                  Column Presets
                </p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  Save and restore column configurations — available in Q3 2026
                </p>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  backgroundColor: "var(--bg-tertiary)",
                  padding: "3px 8px",
                  borderRadius: "var(--radius-xs)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Soon
              </span>
            </div>
          </div>

          {/* About */}
          <div>
            <SectionHeader title="About MarketPulse" />
            <div className="card" style={{ padding: "var(--sp-5)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    backgroundColor: "var(--color-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Activity size={22} color="#ffffff" />
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      marginBottom: 2,
                    }}
                  >
                    MarketPulse
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--text-tertiary)",
                      marginBottom: 12,
                      maxWidth: 480,
                    }}
                  >
                    Institutional-grade real-time market analytics for Indian equities.
                    Built on FastAPI + Next.js with live WebSocket data streaming,
                    dynamic column system, and S3-backed historical data.
                  </p>
                  <div style={{ display: "flex", gap: "var(--sp-5)" }}>
                    {[
                      { label: "Platform", value: "FastAPI + Next.js" },
                      { label: "Data Source", value: "Upstox API" },
                      { label: "Storage", value: "AWS S3" },
                      { label: "Version", value: "1.0.0" },
                    ].map((item) => (
                      <div key={item.label}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            color: "var(--text-tertiary)",
                            display: "block",
                            marginBottom: 2,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {item.label}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Features */}
          <div>
            <SectionHeader title="Coming Soon" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-3)" }}>
              <UpcomingCard
                icon={BarChart3}
                title="Interactive Charts"
                description="Price and volume charts with candlestick, OHLC, and line view for any stock."
                eta="Q3 2026"
              />
              <UpcomingCard
                icon={Bell}
                title="Price Alerts"
                description="Set threshold-based price alerts via email or push notification."
                eta="Q3 2026"
              />
              <UpcomingCard
                icon={Zap}
                title="Options Chain"
                description="Live F&O options chain with Greeks and open interest data."
                eta="Q4 2026"
              />
              <UpcomingCard
                icon={TrendingUp}
                title="Portfolio Tracker"
                description="Import and track your portfolio with P&L calculations and exposure analysis."
                eta="Q4 2026"
              />
              <UpcomingCard
                icon={Globe}
                title="Global Markets"
                description="Add international indices, commodities, and FX to the dashboard."
                eta="2027"
              />
              <UpcomingCard
                icon={Bookmark}
                title="Watchlists"
                description="Create and manage custom stock watchlists with real-time updates."
                eta="Q3 2026"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
