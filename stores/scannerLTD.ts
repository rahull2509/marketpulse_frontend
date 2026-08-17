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
}

interface ScannerState {
  // Data
  results: StockRecord[];
  meta: ScannerMeta | null;

  // Query state
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
  updateFromWebSocket: (results: StockRecord[], meta: ScannerMeta) => void;
  setActiveConditions: (conditions: ScannerCondition[]) => void;
  setLive: (isLive: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  setLoadedPreset: (preset: ScannerPreset | null) => void;
  checkModified: (currentRequest: UnifiedQueryRequest | null) => void;

  reset: () => void;
}

export const useScannerLTDStore = create<ScannerState>((set) => ({
  results: [],
  meta: null,
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

  updateFromWebSocket: (results, meta) =>
    set((state) => ({
      results,
      meta,
      lastUpdated: new Date(),
      liveUpdateCount: state.liveUpdateCount + 1,
    })),

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
