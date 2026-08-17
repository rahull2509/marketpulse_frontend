"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { DynamicTable, type DynamicTableRef } from "@/components/dashboard/DynamicTable";
import { Pagination } from "@/components/common/Pagination";
import { PageSizeSelector } from "@/components/dashboard/PageSizeSelector";
import { ColumnSelector } from "@/components/dashboard/ColumnSelector";
import { useColumnStore } from "@/stores/columns";
import {
  EmptyState,
  ErrorState,
  SkeletonTable,
} from "@/components/common/States";
import { fetchHistory, fetchAvailableDates } from "@/services/data";
import type { StockRecord } from "@/types/stock";
import type { ColumnMetadata } from "@/types/metadata";
import {
  Calendar,
  Clock,
  Search,
  RotateCcw,
  Download,
  Filter,
  History,
} from "lucide-react";

function LabeledInput({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 10,
          fontWeight: 500,
          color: "var(--text-tertiary)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {Icon && <Icon size={10} />}
        {label}
      </label>
      {children}
    </div>
  );
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState("today");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    date: "today",
    symbol: "",
    startTime: "",
    endTime: "",
  });
  const { pageSize } = useColumnStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableRef = useRef<DynamicTableRef>(null);

  // Available dates
  const datesQuery = useQuery({
    queryKey: ["history-dates"],
    queryFn: async () => {
      const res = await fetchAvailableDates();
      return res.data || [];
    },
  });

  // Historical data (only fires when Apply is clicked)
  const historyQuery = useQuery({
    queryKey: [
      "history",
      appliedFilters.date,
      appliedFilters.symbol,
      appliedFilters.startTime,
      appliedFilters.endTime,
      sorting,
    ],
    queryFn: async () => {
      const res = await fetchHistory({
        date: appliedFilters.date,
        symbol: appliedFilters.symbol || undefined,
        start_time: appliedFilters.startTime || undefined,
        end_time: appliedFilters.endTime || undefined,
        sort_by: sorting[0]?.id || undefined,
        sort_order: sorting[0]?.desc ? "desc" : "asc",
        page: 1,
        page_size: 1000,
      });
      return res.data || [];
    },
    placeholderData: keepPreviousData,
    enabled: !!appliedFilters.date,
  });

  const applyFilters = () => {
    setAppliedFilters({
      date: selectedDate,
      symbol: searchSymbol,
      startTime,
      endTime,
    });
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedDate("today");
    setSearchSymbol("");
    setStartTime("");
    setEndTime("");
    setAppliedFilters({ date: "today", symbol: "", startTime: "", endTime: "" });
    setCurrentPage(1);
  };

  const allData: StockRecord[] = historyQuery.data || [];

  const handleDownloadCSV = () => {
    tableRef.current?.downloadCSV(
      `marketpulse_history_${appliedFilters.date}.csv`
    );
  };

  const hasActiveFilters =
    searchSymbol || startTime || endTime || selectedDate !== "today";

  const availableColumns = allData.length > 0 ? Object.keys(allData[0]) : [];

  const metadataOverride = useMemo<ColumnMetadata[]>(() => {
    return availableColumns.map((col) => ({
      column: col,
      display_name: col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      type: typeof allData[0][col] === "number" ? "number" : "string",
      group: "Historical Data",
      visible_default: true,
      unit: "",
      description: "",
      sortable: true,
      filterable: true,
      filter_type: "text",
      operators: [">", "<", ">=", "<=", "=", "!="],
    }));
  }, [availableColumns, allData]);

  // Local state to override the global store, defaulting to all available columns initially
  const [visibleColumnsOverride, setVisibleColumnsOverride] = useState<string[]>([]);

  useEffect(() => {
    if (availableColumns.length > 0 && visibleColumnsOverride.length === 0) {
      setVisibleColumnsOverride(availableColumns);
    }
  }, [availableColumns, visibleColumnsOverride]);

  const handleColumnToggle = (col: string) => {
    setVisibleColumnsOverride((prev) =>
      prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title="Historical Data" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="app-content"
        style={{ padding: "var(--sp-6)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
          {/* Filter Toolbar */}
          <div
            className="card"
            style={{
              padding: "var(--sp-4) var(--sp-5)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap", // change from wrap to nowrap to prevent vertical stacking and keep right-aligned elements visible
                alignItems: "flex-end",
                gap: "var(--sp-4)",
                overflow: "hidden", // fix horizontal overflow
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "var(--sp-4)",
                  overflowX: "auto", // allow scrolling within filters if too narrow
                  paddingBottom: 8,
                }}
              >
                {/* Date */}
                <LabeledInput label="Trading Date" icon={Calendar}>
                  <select
                    className="select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ height: 36, width: 160 }}
                  >
                    <option value="today">Today</option>
                    {datesQuery.data?.map((date) => (
                      <option key={date} value={date}>
                        {date}
                      </option>
                    ))}
                  </select>
                </LabeledInput>

                {/* Symbol */}
                <LabeledInput label="Symbol" icon={Search}>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={13}
                      style={{
                        position: "absolute",
                        left: 10,
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                      }}
                    />
                    <input
                      type="text"
                      className="input"
                      value={searchSymbol}
                      onChange={(e) => setSearchSymbol(e.target.value)}
                      placeholder="e.g. INFY"
                      style={{ width: 130, paddingLeft: 30 }}
                    />
                  </div>
                </LabeledInput>

                {/* Time Range */}
                <LabeledInput label="Time Range" icon={Clock}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                    <input
                      type="text"
                      className="input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="09:15"
                      style={{ width: 72, textAlign: "center" }}
                    />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>to</span>
                    <input
                      type="text"
                      className="input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="15:30"
                      style={{ width: 72, textAlign: "center" }}
                    />
                  </div>
                </LabeledInput>

              </div>
              {/* Actions */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-2)",
                  marginLeft: "auto",
                  paddingBottom: 8,
                  flexShrink: 0,
                }}
              >
                <button
                  className="btn btn-ghost"
                  onClick={resetFilters}
                  title="Reset filters"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
                <button
                  className="btn btn-primary"
                  onClick={applyFilters}
                >
                  <Filter size={13} />
                  Apply
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          {allData.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                }}
              >
                <span
                  className="font-tabular"
                  style={{ fontSize: 12, color: "var(--text-tertiary)" }}
                >
                  {allData.length.toLocaleString("en-IN")} records
                </span>
                {appliedFilters.symbol && (
                  <span className="badge badge-info">
                    {appliedFilters.symbol}
                  </span>
                )}
                {(appliedFilters.startTime || appliedFilters.endTime) && (
                  <span className="badge badge-neutral">
                    {appliedFilters.startTime || "09:15"} — {appliedFilters.endTime || "15:30"}
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
                <ColumnSelector
                  availableColumns={availableColumns}
                  metadataOverride={metadataOverride}
                  visibleColumnsOverride={visibleColumnsOverride}
                  groupsOverride={["Historical Data"]}
                  onColumnToggle={handleColumnToggle}
                  onGroupToggle={(group, isFull) => {
                    if (isFull) setVisibleColumnsOverride([]);
                    else setVisibleColumnsOverride([...availableColumns]);
                  }}
                  onReset={() => setVisibleColumnsOverride(availableColumns)}
                />
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
              </div>
            </div>
          )}

          {historyQuery.isLoading && allData.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
              <div
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "64px 24px",
                  textAlign: "center",
                }}
              >
                <div className="spinner" style={{ marginBottom: "var(--sp-4)" }}></div>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                  Downloading Historical Data...
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Fetching data from cloud storage. This may take a few moments.
                </p>
              </div>
              <SkeletonTable />
            </div>
          ) : historyQuery.error ? (
            <ErrorState
              title="Failed to load historical data"
              message="The data for this date could not be retrieved. It may not have been saved yet."
              onRetry={() => historyQuery.refetch()}
            />
          ) : allData.length > 0 ? (
            <>
              <DynamicTable
                ref={tableRef}
                data={allData}
                globalFilter=""
                pagination={{
                  pageIndex: currentPage - 1,
                  pageSize: pageSize,
                }}
                columnsOverride={visibleColumnsOverride}
                metadataOverride={metadataOverride}
                columnOrderOverride={visibleColumnsOverride}
                sorting={sorting}
                onSortingChange={setSorting}
                manualSorting={true}
                isFetching={historyQuery.isFetching}
              />
              <Pagination
                currentPage={currentPage}
                totalItems={allData.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={() => { }}
              />
            </>
          ) : historyQuery.isFetched ? (
            <EmptyState
              icon={History}
              title="No historical data"
              message="No records were found for the selected date and filters. Try a different date or clear the symbol filter."
              action="Reset Filters"
              onAction={resetFilters}
            />
          ) : (
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "64px 24px",
                textAlign: "center",
              }}
            >
              <History
                size={28}
                style={{ color: "var(--text-muted)", marginBottom: 12 }}
              />
              <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                Select filters and click Apply
              </p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                Choose a date, symbol, and time range to load historical data.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
