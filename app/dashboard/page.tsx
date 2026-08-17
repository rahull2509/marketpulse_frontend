"use client";

import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { MarketSummaryBar } from "@/components/dashboard/MarketSummaryBar";
import { DynamicTable, type DynamicTableRef } from "@/components/dashboard/DynamicTable";
import { ColumnSelector } from "@/components/dashboard/ColumnSelector";
import { SearchBox } from "@/components/dashboard/SearchBox";
import { Pagination } from "@/components/common/Pagination";
import { PageSizeSelector } from "@/components/dashboard/PageSizeSelector";
import {
  LoadingState,
  ErrorState,
  EmptyState,
  MarketClosedBanner,
  SkeletonTable,
  SkeletonCards,
  SkeletonToolbar,
} from "@/components/common/States";
import { useMarketStore } from "@/stores/market";
import { useColumnStore } from "@/stores/columns";
import { RotateCw, Download, SearchX } from "lucide-react";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const { pageSize } = useColumnStore();
  const tableRef = useRef<DynamicTableRef>(null);
  const { stocks, isLoading: storeLoading, marketStatus, error } = useMarketStore();
  const loading = storeLoading;
  
  const refetch = () => {
    window.location.reload();
  };

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


  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const isClosed = !(marketStatus?.is_open ?? false);

  const handleDownloadCSV = () => {
    tableRef.current?.downloadCSV(
      `marketpulse_export_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

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
                gap: "var(--sp-3)",
                overflow: "hidden", // Fix horizontal overflow
              }}
            >
              {/* Left */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  flexShrink: 0,
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
                  gap: "var(--sp-3)",
                  flexShrink: 0,
                }}
              >
                <ColumnSelector />
                <button
                  className="btn btn-secondary"
                  style={{ height: 32 }}
                  onClick={handleDownloadCSV}
                  title="Download current view as CSV"
                >
                  <Download size={14} />
                  <span>CSV</span>
                </button>
                <PageSizeSelector />
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => refetch()}
                  title="Refresh data"
                >
                  <RotateCw size={14} />
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
                ref={tableRef}
                data={filteredStocks}
                globalFilter=""
                pagination={{
                  pageIndex: currentPage - 1,
                  pageSize: pageSize,
                }}
              />
              <Pagination
                currentPage={currentPage}
                totalItems={filteredStocks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={() => {}}
              />
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
