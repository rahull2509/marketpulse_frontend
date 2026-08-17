/**
 * Scanner Store — Manages scanner results and live query state.
 *
 * When a query is active and "live", the backend sends scanner_update
 * messages via WebSocket on every new LiveCache snapshot. This store
 * receives those updates and keeps the scanner results current without
 * requiring a page refresh.
 */

import { create } from "zustand";
import { generateCanonicalHash } from "@/utils/canonical";
import type { StockRecord } from "@/types/stock";
import type { ScannerCondition, UnifiedQueryRequest, ScannerPreset } from "@/types/scanner";

interface ScannerMeta {
  total: number;
  total_scanned?: number;
  matched_count?: number;
  page: number;
  page_size: number;
  total_pages: number;
  conditions_applied: number;
  truncated?: boolean;
  bullish_count?: number;
  bearish_count?: number;
}

interface ScannerState {
  // Data
  results: StockRecord[];
  meta: ScannerMeta | null;

  // Query state
  activeRequest: UnifiedQueryRequest | null;
  activeConditions: ScannerCondition[];
  isLive: boolean;
  hasRun: boolean;

  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  liveUpdateCount: number;

  // Preset Tracking
  loadedPresetId: string | null;
  loadedPresetName: string | null;
  baselineRequest: UnifiedQueryRequest | null;
  isModified: boolean;

  // Actions
  setResults: (results: StockRecord[], meta: ScannerMeta) => void;
  executeLive: (stocks: StockRecord[], request: UnifiedQueryRequest) => void;
  setActiveRequest: (request: UnifiedQueryRequest | null) => void;
  setActiveConditions: (conditions: ScannerCondition[]) => void;
  setLive: (isLive: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setLoadedPreset: (preset: ScannerPreset | null) => void;
  checkModified: (currentRequest: UnifiedQueryRequest | null) => void;
  
  reset: () => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  results: [],
  meta: null,
  activeRequest: null,
  activeConditions: [],
  isLive: false,
  hasRun: false,
  isLoading: false,
  error: null,
  lastUpdated: null,
  liveUpdateCount: 0,
  loadedPresetId: null,
  loadedPresetName: null,
  baselineRequest: null,
  isModified: false,

  setResults: (results, meta) =>
    set({
      results,
      meta,
      hasRun: true,
      isLoading: false,
      error: null,
      lastUpdated: new Date(),
      liveUpdateCount: 0,
    }),

  executeLive: async (stocks: StockRecord[], request: UnifiedQueryRequest) => {
    const { results } = get();
    const { runQuery } = await import("@/services/data");
    
    try {
      const res = await runQuery(request);
      const newSlice = res.data || [];
      const meta = (res as any).meta;
      
      let hasChanges = newSlice.length !== results.length;
      
      const mergedSlice = newSlice.map((newRow: StockRecord, i: number) => {
        const oldRow = results[i];
        if (!oldRow || oldRow.Instrument !== newRow.Instrument) {
          hasChanges = true;
          return newRow;
        }
        
        // If it's the same instrument, check if any values changed
        let rowChanged = false;
        for (const key in newRow) {
          if (newRow[key] !== oldRow[key]) {
            rowChanged = true;
            break;
          }
        }
        
        if (rowChanged) {
          hasChanges = true;
          return newRow;
        }
        
        return oldRow; // Keep same reference to prevent re-render
      });
  
      set((state) => ({
        liveUpdateCount: state.liveUpdateCount + 1,
        ...(hasChanges && {
          results: mergedSlice,
          meta: meta || state.meta,
          lastUpdated: new Date(),
        })
      }));
    } catch (e) {
      console.error("Live execution failed", e);
    }
  },

  setActiveRequest: (request) => set({ activeRequest: request }),

  setActiveConditions: (conditions) =>
    set({ activeConditions: conditions }),

  setLive: (isLive) => set({ isLive }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),

  setLoadedPreset: (preset) => {
    if (!preset) {
      set({
        loadedPresetId: null,
        loadedPresetName: null,
        baselineRequest: null,
        isModified: false,
      });
      return;
    }
    set({
      loadedPresetId: preset.id,
      loadedPresetName: preset.name,
      baselineRequest: preset.request,
      isModified: false,
    });
  },

  checkModified: (currentRequest) => {
    set((state) => {
      if (!state.loadedPresetId || !state.baselineRequest || !currentRequest) return { isModified: false };
      
      const isModified = generateCanonicalHash(state.baselineRequest) !== generateCanonicalHash(currentRequest);
      return { isModified };
    });
  },

  reset: () =>
    set({
      results: [],
      meta: null,
      activeRequest: null,
      activeConditions: [],
      isLive: false,
      hasRun: false,
      isLoading: false,
      error: null,
      lastUpdated: null,
      liveUpdateCount: 0,
      loadedPresetId: null,
      loadedPresetName: null,
      baselineRequest: null,
      isModified: false,
    }),
}));
