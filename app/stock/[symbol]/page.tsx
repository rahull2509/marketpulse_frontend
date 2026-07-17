"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  SkeletonTable,
} from "@/components/common/States";
import { Pagination } from "@/components/common/Pagination";
import { fetchStockDetail, fetchTimeline } from "@/services/data";
import { useColumnStore } from "@/stores/columns";
import { useMarketStore } from "@/stores/market";
import {
  formatCurrency,
  formatPercent,
  formatChange,
  formatVolume,
  getChangeClass,
} from "@/utils/format";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RotateCw,
  Clock,
  BarChart3,
  Activity,
  Info,
} from "lucide-react";
import Link from "next/link";
import type { StockRecord } from "@/types/stock";
import type { ColumnMetadata } from "@/types/metadata";
import { useState } from "react";

/* ── Quick Stat Card ─────────────────────────────────────────── */

function StatCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: unknown;
  unit?: string;
}) {
  let formatted: string;
  if (value === null || value === undefined) {
    formatted = "—";
  } else if (unit === "₹") {
    formatted = formatCurrency(value);
  } else if (unit === "%") {
    formatted = formatPercent(value);
  } else {
    const num = Number(value);
    formatted = isNaN(num) ? String(value) : num.toLocaleString("en-IN");
  }

  return (
    <div className="card-compact" style={{ minWidth: 120, flex: "1 1 120px" }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          display: "block",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <span
        className="font-tabular"
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {formatted}
      </span>
    </div>
  );
}

/* ── Indicator Card ──────────────────────────────────────────── */

function IndicatorCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: unknown;
  unit?: string;
}) {
  let display: string;
  if (value === null || value === undefined) {
    display = "—";
  } else if (unit === "₹") {
    display = formatCurrency(value);
  } else if (unit === "%") {
    display = formatPercent(Number(value));
  } else {
    const num = Number(value);
    display = isNaN(num) ? String(value) : num.toLocaleString("en-IN", { maximumFractionDigits: 4 });
  }

  return (
    <div
      className="card"
      style={{ padding: "var(--sp-3) var(--sp-4)", minWidth: 140 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
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
          {label}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 9,
              color: "var(--text-muted)",
              backgroundColor: "var(--bg-tertiary)",
              padding: "1px 5px",
              borderRadius: "var(--radius-xs)",
            }}
          >
            {unit}
          </span>
        )}
      </div>
      <span
        className="font-tabular"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {display}
      </span>
    </div>
  );
}

/* ── Indicator Sections ──────────────────────────────────────── */

function IndicatorSection({
  stock,
  metadata,
}: {
  stock: StockRecord;
  metadata: ColumnMetadata[];
}) {
  const SKIP_GROUPS = ["Identity", "Metadata"];
  const displayCols = metadata.filter(
    (m) => !SKIP_GROUPS.includes(m.group) && m.column in stock
  );
  const groupNames = [...new Set(displayCols.map((m) => m.group))];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
      {groupNames.map((group) => {
        const cols = displayCols.filter((m) => m.group === group);
        return (
          <div key={group}>
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
              {group}
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--sp-3)",
              }}
            >
              {cols.map((col) => (
                <IndicatorCard
                  key={col.column}
                  label={col.display_name}
                  value={stock[col.column]}
                  unit={col.unit}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Timeline Table ──────────────────────────────────────────── */

function TimelineTable({ timeline }: { timeline: StockRecord[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 25;

  if (!timeline.length) {
    return (
      <EmptyState
        icon={Clock}
        title="No timeline data"
        message="Minute-by-minute data is not available for this trading session."
      />
    );
  }

  const paginated = timeline.slice((page - 1) * pageSize, page * pageSize);
  const firstPrice = Number(timeline[0]?.["Last Price"] ?? 0);

  return (
    <div>
      <div className="table-container">
        <table className="market-table">
          <thead>
            <tr>
              <th>Time</th>
              <th style={{ textAlign: "right" }}>Price (₹)</th>
              <th style={{ textAlign: "right" }}>Change</th>
              <th style={{ textAlign: "right" }}>Volume</th>
              <th style={{ textAlign: "right" }}>Avg Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, idx) => {
              const price = Number(row["Last Price"] ?? 0);
              const prevPrice =
                idx === 0
                  ? firstPrice
                  : Number(paginated[idx - 1]?.["Last Price"] ?? price);
              const change = price - prevPrice;
              const isUp = change >= 0;

              return (
                <tr key={idx}>
                  <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                    {String(row.time || "—")}
                  </td>
                  <td
                    className="font-tabular"
                    style={{ textAlign: "right", fontWeight: 500 }}
                  >
                    {formatCurrency(price)}
                  </td>
                  <td
                    className="font-tabular"
                    style={{
                      textAlign: "right",
                      color: isUp
                        ? "var(--color-positive)"
                        : "var(--color-negative)",
                      fontWeight: 500,
                    }}
                  >
                    {idx === 0 ? "—" : formatChange(change)}
                  </td>
                  <td
                    className="font-tabular"
                    style={{ textAlign: "right", color: "var(--text-secondary)" }}
                  >
                    {formatVolume(row.Volume)}
                  </td>
                  <td
                    className="font-tabular"
                    style={{ textAlign: "right", color: "var(--text-secondary)" }}
                  >
                    {formatCurrency(row["Average Price"])}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {timeline.length > pageSize && (
        <Pagination
          currentPage={page}
          totalItems={timeline.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          pageSizeOptions={[25]}
        />
      )}
    </div>
  );
}

/* ── Stock Header ────────────────────────────────────────────── */

function StockHeader({
  stock,
  marketStatus,
  onRefresh,
}: {
  stock: StockRecord;
  marketStatus: import("@/types/stock").MarketStatusData | null;
  onRefresh: () => void;
}) {
  const change = Number(stock["Net Change"] ?? 0);
  const changePct = Number(stock.day_change_pct ?? 0);
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isLive = marketStatus?.is_open ?? false;

  return (
    <div
      className="card"
      style={{
        padding: "var(--sp-5) var(--sp-6)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--sp-6)",
      }}
    >
      {/* Left — Identification */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--sp-4)" }}>
        <Link
          href="/dashboard"
          className="btn btn-ghost btn-icon"
          style={{ flexShrink: 0, marginTop: 4 }}
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-3)",
              marginBottom: 4,
            }}
          >
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {String(stock.trading_symbol || stock.Instrument)}
            </h2>
            <span
              className="badge badge-neutral"
              style={{ fontSize: 10 }}
            >
              {String(stock.exchange || "NSE")}
            </span>
            {isLive ? (
              <span className="badge badge-live">
                <span className="live-dot" />
                LIVE
              </span>
            ) : (
              <span className="badge badge-closed">CLOSED</span>
            )}
          </div>
          {typeof stock.company_name === "string" && stock.company_name && (
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              {stock.company_name}
            </p>
          )}
        </div>
      </div>

      {/* Right — Price */}
      <div style={{ textAlign: "right", display: "flex", alignItems: "flex-start", gap: "var(--sp-3)" }}>
        <div>
          <div
            className="font-tabular"
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "var(--text-primary)",
              lineHeight: 1,
              marginBottom: 4,
            }}
          >
            {formatCurrency(stock["Last Price"])}
          </div>
          <div
            className={`font-tabular ${getChangeClass(change)}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              justifyContent: "flex-end",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            {isPositive ? (
              <TrendingUp size={14} />
            ) : isNegative ? (
              <TrendingDown size={14} />
            ) : null}
            {formatChange(change)}
            <span>({formatPercent(changePct)})</span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={onRefresh}
          title="Refresh"
          style={{ marginTop: 4 }}
        >
          <RotateCw size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────── */

export default function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const decodedSymbol = decodeURIComponent(symbol);
  const { metadata } = useColumnStore();
  const marketStatus = useMarketStore((s) => s.marketStatus);

  const stockQuery = useQuery({
    queryKey: ["stock", decodedSymbol],
    queryFn: async () => {
      const res = await fetchStockDetail(decodedSymbol);
      if (!res.success) throw new Error(res.error?.message || "Stock not found");
      return res.data;
    },
    refetchInterval: 60_000,
  });

  const timelineQuery = useQuery({
    queryKey: ["timeline", decodedSymbol],
    queryFn: async () => {
      const res = await fetchTimeline(decodedSymbol);
      if (!res.success) return [];
      return res.data;
    },
    refetchInterval: 60_000,
  });

  // Quick stats columns
  const QUICK_STAT_COLS = [
    { key: "Open", label: "Open", unit: "₹" },
    { key: "High", label: "High", unit: "₹" },
    { key: "Low", label: "Low", unit: "₹" },
    { key: "Close", label: "Prev Close", unit: "₹" },
    { key: "Average Price", label: "Avg Price", unit: "₹" },
    { key: "Volume", label: "Volume", unit: "" },
    { key: "Total Buy Quantity", label: "Buy Qty", unit: "" },
    { key: "Total Sell Quantity", label: "Sell Qty", unit: "" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title={`Stock Analytics`} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="app-content"
        style={{ padding: "var(--sp-6)" }}
      >
        {stockQuery.isLoading ? (
          <LoadingState message={`Loading ${decodedSymbol}...`} />
        ) : stockQuery.error ? (
          <ErrorState
            title={`Cannot load ${decodedSymbol}`}
            message="The stock data could not be retrieved. The symbol may not exist or the server is unavailable."
            onRetry={() => stockQuery.refetch()}
          />
        ) : stockQuery.data ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--sp-5)",
            }}
          >
            {/* Stock Header */}
            <StockHeader
              stock={stockQuery.data}
              marketStatus={marketStatus}
              onRefresh={() => {
                stockQuery.refetch();
                timelineQuery.refetch();
              }}
            />

            {/* Quick Stats */}
            <div>
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
                Quick Statistics
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--sp-3)",
                }}
              >
                {QUICK_STAT_COLS.map(({ key, label, unit }) => (
                  <StatCard
                    key={key}
                    label={label}
                    value={stockQuery.data![key as keyof typeof stockQuery.data]}
                    unit={unit}
                  />
                ))}
              </div>
            </div>

            {/* Indicators */}
            {metadata.length > 0 && (
              <div>
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
                  Indicators
                </h3>
                <IndicatorSection
                  stock={stockQuery.data}
                  metadata={metadata}
                />
              </div>
            )}

            {/* Chart Placeholder */}
            <div
              className="card"
              style={{
                padding: "var(--sp-5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 160,
                borderStyle: "dashed",
              }}
            >
              <BarChart3
                size={28}
                style={{ color: "var(--text-muted)", marginBottom: 8 }}
              />
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--text-tertiary)",
                  marginBottom: 2,
                }}
              >
                Interactive Chart
              </p>
              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Price and volume charts — coming in Q3 2026
              </p>
            </div>

            {/* Timeline */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-2)",
                  marginBottom: "var(--sp-3)",
                }}
              >
                <Clock size={14} style={{ color: "var(--text-tertiary)" }} />
                <h3
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-tertiary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Minute-by-Minute Timeline
                </h3>
                {timelineQuery.data && (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginLeft: 4,
                    }}
                  >
                    ({timelineQuery.data.length} data points)
                  </span>
                )}
              </div>
              {timelineQuery.isLoading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : (
                <TimelineTable timeline={timelineQuery.data || []} />
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
