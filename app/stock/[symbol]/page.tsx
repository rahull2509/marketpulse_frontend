"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { LoadingState, ErrorState, EmptyState } from "@/components/common/States";
import { fetchStockDetail, fetchTimeline } from "@/services/data";
import { useColumnStore } from "@/stores/columns";
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
  BarChart3,
  Clock,
  Activity,
} from "lucide-react";
import Link from "next/link";
import type { StockRecord } from "@/types/stock";
import type { ColumnMetadata } from "@/types/metadata";

function StockHeader({ stock }: { stock: StockRecord }) {
  const change = Number(stock["Net Change"] || 0);
  const changePct = Number(stock.day_change_pct || 0);
  const isPositive = change > 0;

  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {String(stock.trading_symbol || stock.Instrument)}
            </h2>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase"
              style={{
                backgroundColor: "var(--bg-tertiary)",
                color: "var(--text-tertiary)",
              }}
            >
              {String(stock.exchange || "NSE")}
            </span>
          </div>
          {typeof stock.company_name === "string" && stock.company_name && (
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-secondary)" }}>
              {stock.company_name}
            </p>
          )}
        </div>
      </div>

      <div className="text-right">
        <div className="text-3xl font-bold font-tabular" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(stock["Last Price"])}
        </div>
        <div className={`flex items-center justify-end gap-1.5 text-sm font-medium font-tabular ${getChangeClass(change)}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {formatChange(change)}
          <span>({formatPercent(changePct)})</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit }: { label: string; value: unknown; unit?: string }) {
  const formatted =
    unit === "₹" ? formatCurrency(value) : unit === "%" ? formatPercent(value) : formatVolume(value);

  return (
    <div className="glass-card flex flex-col gap-1 p-4">
      <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--text-tertiary)" }}>
        {label}
      </span>
      <span className="text-lg font-semibold font-tabular" style={{ color: "var(--text-primary)" }}>
        {formatted}
      </span>
    </div>
  );
}

function IndicatorPanel({ stock, metadata }: { stock: StockRecord; metadata: ColumnMetadata[] }) {
  // Group non-identity, non-metadata columns for display
  const displayCols = metadata.filter(
    (m) => !["Identity", "Metadata"].includes(m.group) && m.column in stock
  );

  const groups = [...new Set(displayCols.map((m) => m.group))];

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const cols = displayCols.filter((m) => m.group === group);
        return (
          <div key={group}>
            <h3
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              {group}
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {cols.map((col) => (
                <StatCard
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

function MinuteTimeline({ timeline }: { timeline: StockRecord[] }) {
  if (!timeline.length) {
    return <EmptyState message="No timeline data available for today" />;
  }

  // Find min/max price for scaling
  const prices = timeline
    .map((t) => Number(t["Last Price"]))
    .filter((p) => !isNaN(p));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  return (
    <div className="glass-card overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          <Clock className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
          Minute-by-Minute Timeline
        </h3>
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {timeline.length} data points
        </span>
      </div>

      {/* Simple bar chart visualization */}
      <div className="flex items-end gap-px" style={{ height: "120px" }}>
        {timeline.map((point, idx) => {
          const price = Number(point["Last Price"] || 0);
          const height = ((price - minPrice) / range) * 100;
          const prevPrice = idx > 0 ? Number(timeline[idx - 1]["Last Price"] || 0) : price;
          const isUp = price >= prevPrice;

          return (
            <div
              key={idx}
              className="group relative flex-1 cursor-pointer transition-opacity hover:opacity-80"
              title={`${point.time || ""}: ${formatCurrency(price)}`}
            >
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(height, 2)}%`,
                  backgroundColor: isUp ? "var(--color-positive)" : "var(--color-negative)",
                  opacity: 0.7,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Time labels */}
      <div className="mt-2 flex justify-between">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {String(timeline[0]?.time || "09:00")}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {String(timeline[Math.floor(timeline.length / 2)]?.time || "12:15")}
        </span>
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
          {String(timeline[timeline.length - 1]?.time || "15:30")}
        </span>
      </div>
    </div>
  );
}

export default function StockPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const decodedSymbol = decodeURIComponent(symbol);
  const { metadata } = useColumnStore();

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
      if (!res.success) throw new Error(res.error?.message);
      return res.data;
    },
    refetchInterval: 60_000,
  });

  return (
    <div className="flex flex-col">
      <TopBar title={`Stock: ${decodedSymbol}`} />

      <div className="flex flex-col gap-6 p-6">
        {stockQuery.isLoading ? (
          <LoadingState message={`Loading ${decodedSymbol}...`} />
        ) : stockQuery.error ? (
          <ErrorState
            message={`Failed to load ${decodedSymbol}`}
            onRetry={() => stockQuery.refetch()}
          />
        ) : stockQuery.data ? (
          <>
            <StockHeader stock={stockQuery.data} />
            <MinuteTimeline timeline={timelineQuery.data || []} />
            <IndicatorPanel stock={stockQuery.data} metadata={metadata} />
          </>
        ) : null}
      </div>
    </div>
  );
}
