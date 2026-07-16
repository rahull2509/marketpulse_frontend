"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { MarketSummaryBar } from "@/components/dashboard/MarketSummaryBar";
import { DynamicTable } from "@/components/dashboard/DynamicTable";
import { ColumnSelector } from "@/components/dashboard/ColumnSelector";
import { SearchBox } from "@/components/dashboard/SearchBox";
import { LoadingState, ErrorState, SkeletonTable } from "@/components/common/States";
import { useLiveData } from "@/hooks/useLiveData";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMarketStore } from "@/stores/market";
import { RefreshCw, Download } from "lucide-react";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { isLoading, error, refetch } = useLiveData();
  useWebSocket(); // Connect WebSocket on mount

  const { stocks, isLoading: storeLoading } = useMarketStore();

  const loading = isLoading || storeLoading;

  return (
    <div className="flex flex-col">
      <TopBar title="Live Market Dashboard" />

      <div className="flex flex-col gap-4 p-6">
        {/* Market Summary */}
        <MarketSummaryBar />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SearchBox value={searchQuery} onChange={setSearchQuery} />
            <span className="text-xs font-tabular" style={{ color: "var(--text-tertiary)" }}>
              {stocks.length.toLocaleString("en-IN")} stocks
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
              style={{
                borderColor: "var(--border-secondary)",
                color: "var(--text-secondary)",
              }}
              title="Refresh data"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <ColumnSelector />
          </div>
        </div>

        {/* Table */}
        {loading && !stocks.length ? (
          <SkeletonTable />
        ) : error && !stocks.length ? (
          <ErrorState
            message="Failed to load market data"
            onRetry={() => refetch()}
          />
        ) : (
          <DynamicTable data={stocks} globalFilter={searchQuery} />
        )}
      </div>
    </div>
  );
}
