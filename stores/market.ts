/**
 * Market Store — Live market data state management.
 *
 * Central state for the dashboard: stocks array, snapshot metadata,
 * and market status. Supports both initial REST load
 * and incremental WebSocket delta updates.
 */

import { create } from "zustand";
import type { StockRecord, IndexData, MarketStatusData, CacheInfo } from "@/types/stock";

interface MarketState {
  // Data
  stocks: StockRecord[];
  marketStatus: MarketStatusData | null;
  cacheInfo: CacheInfo | null;
  version: number;

  // UI State
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  // Actions
  setStocks: (stocks: StockRecord[]) => void;
  applyDelta: (changedRows: StockRecord[]) => void;
  setMarketStatus: (status: MarketStatusData) => void;
  setCacheInfo: (info: CacheInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  stocks: [],
  marketStatus: null,
  cacheInfo: null,
  version: 0,
  isLoading: true,
  error: null,
  lastUpdated: null,

  setStocks: (stocks) =>
    set((state) => ({
      stocks,
      version: state.version + 1,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
    })),

  applyDelta: (changedRows) => {
    const { stocks, version } = get();
    if (!changedRows.length) return;

    // Build a map for O(1) lookups
    const changeMap = new Map(
      changedRows.map((row) => [row.Instrument, row])
    );

    const updated = stocks.map((stock) => {
      const change = changeMap.get(stock.Instrument);
      return change ? { ...stock, ...change } : stock;
    });

    // Add any new instruments not in current state
    const existingKeys = new Set(stocks.map((s) => s.Instrument));
    const newStocks = changedRows.filter((r) => !existingKeys.has(r.Instrument));

    set({
      stocks: [...updated, ...newStocks],
      version: version + 1,
      lastUpdated: new Date(),
    });
  },

  setMarketStatus: (status) => set({ marketStatus: status }),
  setCacheInfo: (info) => set({ cacheInfo: info }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
}));
