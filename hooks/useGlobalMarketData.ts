/**
 * useLiveData — Fetches initial data and coordinates with WebSocket.
 *
 * This hook:
 * 1. Loads the dashboard snapshot via REST on mount
 * 2. Loads column metadata on mount
 * 3. Loads market status
 * 4. TanStack Query handles caching, refetching, and stale data
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { useMarketStore } from "@/stores/market";
import { useColumnStore } from "@/stores/columns";
import { REFRESH_INTERVALS } from "@/constants/market";
import {
  fetchDashboard,
  fetchMetadata,
  fetchMarketStatus,
} from "@/services/data";
import { useEffect } from "react";

export function useGlobalMarketData() {
  const { setStocks, setCacheInfo, setMarketStatus, setLoading, setError } =
    useMarketStore();
  const { setMetadata } = useColumnStore();

  // ── Dashboard (initial snapshot) ─────────────────────────────────
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetchDashboard();
      if (!res.success) throw new Error(res.error?.message || "Failed to load dashboard");
      return res.data;
    },
    staleTime: REFRESH_INTERVALS.DASHBOARD,
    refetchInterval: REFRESH_INTERVALS.DASHBOARD,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });

  // ── Column Metadata ──────────────────────────────────────────────
  const metadataQuery = useQuery({
    queryKey: ["metadata"],
    queryFn: async () => {
      const res = await fetchMetadata();
      if (!res.success) throw new Error(res.error?.message || "Failed to load metadata");
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min — metadata rarely changes
    retry: 3,
  });

  // ── Market Status ────────────────────────────────────────────────
  const statusQuery = useQuery({
    queryKey: ["market-status"],
    queryFn: async () => {
      const res = await fetchMarketStatus();
      if (!res.success) throw new Error(res.error?.message);
      return res.data;
    },
    refetchInterval: REFRESH_INTERVALS.MARKET_STATUS,
    staleTime: REFRESH_INTERVALS.MARKET_STATUS,
  });


  // Sync query results to stores
  useEffect(() => {
    if (dashboardQuery.data) {
      setStocks(dashboardQuery.data.stocks);
      setCacheInfo(dashboardQuery.data.info);
    }
    if (dashboardQuery.isLoading) setLoading(true);
    if (dashboardQuery.error) setError(String(dashboardQuery.error));
  }, [dashboardQuery.data, dashboardQuery.isLoading, dashboardQuery.error, setStocks, setCacheInfo, setLoading, setError]);

  useEffect(() => {
    if (metadataQuery.data) {
      setMetadata(metadataQuery.data.columns, metadataQuery.data.groups);
    }
  }, [metadataQuery.data, setMetadata]);

  useEffect(() => {
    if (statusQuery.data) setMarketStatus(statusQuery.data);
  }, [statusQuery.data, setMarketStatus]);


  return {
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch,
  };
}
