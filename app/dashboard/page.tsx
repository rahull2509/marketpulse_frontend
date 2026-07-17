"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { MarketSummaryBar } from "@/components/dashboard/MarketSummaryBar";
import { DynamicTable } from "@/components/dashboard/DynamicTable";
import { ColumnSelector } from "@/components/dashboard/ColumnSelector";
import { SearchBox } from "@/components/dashboard/SearchBox";
import { Pagination } from "@/components/common/Pagination";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  MarketClosedBanner,
  SkeletonTable,
  SkeletonCards,
  SkeletonToolbar,
} from "@/components/common/States";
import { useLiveData } from "@/hooks/useLiveData";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMarketStore } from "@/stores/market";
import { RotateCw, Download, SearchX } from "lucide-react";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { isLoading, error, refetch } = useLiveData();
  useWebSocket();

  const { stocks, isLoading: storeLoading, marketStatus } = useMarketStore();
  const loading = isLoading || storeLoading;

  // Filter stocks by search query
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks;
    const search = searchQuery.toLowerCase();
    return stocks.filter((s) => {
      const symbol = String(s.trading_symbol || "").toLowerCase();
      const instrument = String(s.Instrument || "").toLowerCase();
      const company = String(s.company_name || "").toLowerCase();
      return (
        symbol.includes(search) ||
        instrument.includes(search) ||
        company.includes(search)
      );
    });
  }, [stocks, searchQuery]);


  // Paginate
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStocks.slice(start, start + pageSize);
  }, [filteredStocks, currentPage, pageSize]);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const isClosed = !(marketStatus?.is_open ?? false);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title="Dashboard" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="app-content"
        style={{ padding: "var(--sp-6)" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-5)",
          }}
        >
          {/* Market Closed Banner */}
          {isClosed && stocks.length > 0 && (
            <MarketClosedBanner />
          )}

          {/* Market Summary Cards */}
          {loading && !stocks.length ? (
            <SkeletonCards />
          ) : (
            <MarketSummaryBar />
          )}

          {/* Toolbar */}
          {loading && !stocks.length ? (
            <SkeletonToolbar />
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "var(--sp-3)",
              }}
            >
              {/* Left */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                }}
              >
                <SearchBox
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                <span
                  className="font-tabular"
                  style={{
                    fontSize: 12,
                    color: "var(--text-tertiary)",
                  }}
                >
                  {filteredStocks.length.toLocaleString("en-IN")} stocks
                </span>
              </div>

              {/* Right */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-2)",
                }}
              >
                <ColumnSelector />
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => refetch()}
                  title="Refresh data"
                >
                  <RotateCw size={14} />
                </button>
                <button
                  className="btn btn-ghost"
                  disabled
                  title="Coming Soon"
                  style={{ opacity: 0.4 }}
                >
                  <Download size={14} />
                  Export
                </button>
              </div>
            </div>
          )}

          {/* Table + Pagination */}
          {loading && !stocks.length ? (
            <SkeletonTable />
          ) : error && !stocks.length ? (
            <ErrorState
              title="Backend Offline"
              message="Unable to connect to the data server. Attempting to reconnect..."
              onRetry={() => refetch()}
            />
          ) : filteredStocks.length === 0 && searchQuery ? (
            <EmptyState
              icon={SearchX}
              title="No stocks found"
              message={`No results for "${searchQuery}". Try a different symbol or company name.`}
              action="Clear Search"
              onAction={() => handleSearchChange("")}
            />
          ) : (
            <>
              <DynamicTable
                data={paginatedStocks}
                globalFilter=""
              />
              {filteredStocks.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredStocks.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                  }}
                />
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
