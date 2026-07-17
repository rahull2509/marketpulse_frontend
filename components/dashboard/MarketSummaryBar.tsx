"use client";

import { useMarketStore } from "@/stores/market";

export function MarketSummaryBar() {
  const stocks = useMarketStore((s) => s.stocks);
  const marketStatus = useMarketStore((s) => s.marketStatus);

  const totalStocks = stocks.length;
  const advancers = stocks.filter(
    (s) => typeof s.day_change_pct === "number" && s.day_change_pct > 0
  ).length;
  const decliners = stocks.filter(
    (s) => typeof s.day_change_pct === "number" && s.day_change_pct < 0
  ).length;
  const unchanged = totalStocks - advancers - decliners;

  const advPct = totalStocks > 0 ? (advancers / totalStocks) * 100 : 0;
  const decPct = totalStocks > 0 ? (decliners / totalStocks) * 100 : 0;

  if (totalStocks === 0) return null;

  return (
    <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "stretch", overflowX: "auto" }}>
      {/* Total */}
      <StatCard label="Total Stocks" value={totalStocks.toLocaleString("en-IN")} />

      {/* Advancers */}
      <StatCard
        label="Advancers"
        value={advancers.toLocaleString("en-IN")}
        valueColor="var(--color-positive)"
        indicator="positive"
      />

      {/* Decliners */}
      <StatCard
        label="Decliners"
        value={decliners.toLocaleString("en-IN")}
        valueColor="var(--color-negative)"
        indicator="negative"
      />

      {/* Unchanged */}
      <StatCard label="Unchanged" value={unchanged.toLocaleString("en-IN")} />

      {/* Market Breadth */}
      <div
        className="card-compact"
        style={{ minWidth: 180, display: "flex", flexDirection: "column", gap: 6 }}
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
          Market Breadth
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="font-tabular"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--color-positive)" }}
          >
            {advPct.toFixed(0)}%
          </span>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: "var(--bg-tertiary)",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                width: `${advPct}%`,
                backgroundColor: "var(--color-positive)",
                transition: "width 500ms ease",
              }}
            />
            <div
              style={{
                width: `${100 - advPct - decPct}%`,
                backgroundColor: "var(--color-neutral)",
                opacity: 0.3,
              }}
            />
            <div
              style={{
                width: `${decPct}%`,
                backgroundColor: "var(--color-negative)",
                transition: "width 500ms ease",
              }}
            />
          </div>
          <span
            className="font-tabular"
            style={{ fontSize: 12, fontWeight: 600, color: "var(--color-negative)" }}
          >
            {decPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueColor,
  indicator,
}: {
  label: string;
  value: string;
  valueColor?: string;
  indicator?: "positive" | "negative";
}) {
  return (
    <div className="card-compact" style={{ minWidth: 110 }}>
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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {indicator && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor:
                indicator === "positive"
                  ? "var(--color-positive)"
                  : "var(--color-negative)",
              flexShrink: 0,
            }}
          />
        )}
        <span
          className="font-tabular"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: valueColor || "var(--text-primary)",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
