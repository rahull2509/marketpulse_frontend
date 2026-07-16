"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { DynamicTable } from "@/components/dashboard/DynamicTable";
import { LoadingState, ErrorState, EmptyState, SkeletonTable } from "@/components/common/States";
import { fetchHistory, fetchAvailableDates } from "@/services/data";
import type { StockRecord } from "@/types/stock";
import { Calendar, Clock, Search } from "lucide-react";

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState("today");
  const [searchSymbol, setSearchSymbol] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Available dates
  const datesQuery = useQuery({
    queryKey: ["history-dates"],
    queryFn: async () => {
      const res = await fetchAvailableDates();
      return res.data;
    },
  });

  // Historical data
  const historyQuery = useQuery({
    queryKey: ["history", selectedDate, searchSymbol, startTime, endTime],
    queryFn: async () => {
      const res = await fetchHistory({
        date: selectedDate,
        symbol: searchSymbol || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        page: 1,
        page_size: 500,
      });
      return res.data;
    },
    enabled: !!selectedDate,
  });

  return (
    <div className="flex flex-col">
      <TopBar title="Historical Data" />

      <div className="flex flex-col gap-4 p-6">
        {/* Filters */}
        <div className="glass-card flex flex-wrap items-end gap-4 p-4">
          {/* Date selector */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
              <Calendar className="h-3 w-3" />
              Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border bg-transparent px-3 py-1.5 text-xs"
              style={{
                borderColor: "var(--border-secondary)",
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-secondary)",
              }}
            >
              <option value="today">Today</option>
              {datesQuery.data?.map((date) => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          {/* Symbol filter */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
              <Search className="h-3 w-3" />
              Symbol
            </label>
            <input
              type="text"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              placeholder="e.g., INFY"
              className="w-32 rounded-md border bg-transparent px-3 py-1.5 text-xs"
              style={{
                borderColor: "var(--border-secondary)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Time range */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--text-tertiary)" }}>
              <Clock className="h-3 w-3" />
              Time Range
            </label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                placeholder="09:00"
                className="w-16 rounded-md border bg-transparent px-2 py-1.5 text-xs text-center"
                style={{
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-primary)",
                }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
              <input
                type="text"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                placeholder="15:30"
                className="w-16 rounded-md border bg-transparent px-2 py-1.5 text-xs text-center"
                style={{
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        {historyQuery.isLoading ? (
          <SkeletonTable />
        ) : historyQuery.error ? (
          <ErrorState
            message="Failed to load historical data"
            onRetry={() => historyQuery.refetch()}
          />
        ) : historyQuery.data && historyQuery.data.length > 0 ? (
          <>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {historyQuery.data.length} records
            </span>
            <DynamicTable data={historyQuery.data} globalFilter="" />
          </>
        ) : (
          <EmptyState message="No historical data found for the selected criteria." />
        )}
      </div>
    </div>
  );
}
