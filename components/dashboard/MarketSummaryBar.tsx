"use client";

import { useMarketStore } from "@/stores/market";
import { formatCurrency, formatPercent, formatCompact } from "@/utils/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { IndexData } from "@/types/stock";

function IndexCard({ index }: { index: IndexData }) {
  const isUp = index.direction === "up";
  const isDown = index.direction === "down";

  return (
    <div
      className="glass-card flex min-w-[180px] flex-col gap-1 px-4 py-3 transition-all duration-200 hover:scale-[1.02]"
    >
      <span
        className="text-xs font-medium tracking-wide"
        style={{ color: "var(--text-tertiary)" }}
      >
        {index.name}
      </span>
      <span
        className="text-base font-semibold font-tabular"
        style={{ color: "var(--text-primary)" }}
      >
        {index.value !== null ? formatCurrency(index.value) : "—"}
      </span>
      <span
        className="flex items-center gap-1 text-xs font-medium font-tabular"
        style={{
          color: isUp
            ? "var(--color-positive)"
            : isDown
            ? "var(--color-negative)"
            : "var(--color-neutral)",
        }}
      >
        {isUp ? (
          <TrendingUp className="h-3 w-3" />
        ) : isDown ? (
          <TrendingDown className="h-3 w-3" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
        {index.change !== null
          ? `${index.change > 0 ? "+" : ""}${index.change.toFixed(2)}`
          : "—"}
        {index.change_pct !== null && (
          <span className="ml-0.5">
            ({formatPercent(index.change_pct)})
          </span>
        )}
      </span>
    </div>
  );
}

export function MarketSummaryBar() {
  const indices = useMarketStore((s) => s.indices);
  const marketStatus = useMarketStore((s) => s.marketStatus);
  const stocks = useMarketStore((s) => s.stocks);

  // Compute summary stats from stocks
  const totalStocks = stocks.length;
  const advancers = stocks.filter(
    (s) => typeof s.day_change_pct === "number" && s.day_change_pct > 0
  ).length;
  const decliners = stocks.filter(
    (s) => typeof s.day_change_pct === "number" && s.day_change_pct < 0
  ).length;
  const unchanged = totalStocks - advancers - decliners;

  return (
    <div className="flex flex-col gap-3">
      {/* Indices Row */}
      {indices.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {indices.map((idx) => (
            <IndexCard key={idx.name} index={idx} />
          ))}
        </div>
      )}

      {/* Market Breadth */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-positive)" }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--color-positive)" }}>
              {advancers} Advancers
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>|</span>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "var(--color-negative)" }}
            />
            <span className="text-xs font-medium" style={{ color: "var(--color-negative)" }}>
              {decliners} Decliners
            </span>
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>|</span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {unchanged} Unchanged
          </span>
        </div>

        {/* Market Breadth Bar */}
        {totalStocks > 0 && (
          <div
            className="flex h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--bg-tertiary)", maxWidth: "200px" }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(advancers / totalStocks) * 100}%`,
                backgroundColor: "var(--color-positive)",
              }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(unchanged / totalStocks) * 100}%`,
                backgroundColor: "var(--color-neutral)",
              }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(decliners / totalStocks) * 100}%`,
                backgroundColor: "var(--color-negative)",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
