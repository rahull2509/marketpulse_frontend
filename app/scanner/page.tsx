"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { DynamicTable, type DynamicTableRef } from "@/components/dashboard/DynamicTable";
import { Pagination } from "@/components/common/Pagination";
import { PageSizeSelector } from "@/components/dashboard/PageSizeSelector";
import { ColumnSelector } from "@/components/dashboard/ColumnSelector";
import { QueryBuilder } from "@/components/scanner/QueryBuilder";
import { PresetCard } from "@/components/scanner/PresetCard";
import { SaveQueryModal } from "@/components/scanner/SaveQueryModal";
import { MyPresetsList } from "@/components/scanner/MyPresetsList";
import {
  EmptyState,
  SkeletonTable,
  ErrorState,
} from "@/components/common/States";
import { useColumnStore } from "@/stores/columns";
import { useScannerStore } from "@/stores/scanner";
import { useWebSocketStore } from "@/stores/websocket";
import { useMarketStore } from "@/stores/market";
import { fetchScannerPresets, runScanner } from "@/services/data";
import type {
  ScannerCondition,
  ScannerPreset,
  ScannerRequest,
} from "@/types/scanner";
import type { StockRecord } from "@/types/stock";
import {
  ScanSearch,
  Plus,
  Trash2,
  Play,
  Bookmark,
  X,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Activity,
  Download,
  Radio,
  Square,
  Sparkles,
  Save,
} from "lucide-react";

/* ── Operators ───────────────────────────────────────────────── */

const OPERATORS = [">", "<", ">=", "<=", "=", "!=", "between", "contains"];
const NUMERIC_OPS = [">", "<", ">=", "<=", "between"];

const PRESET_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  default: Bookmark,
  bullish: TrendingUp,
  bearish: TrendingDown,
  volume: BarChart3,
  momentum: Zap,
  institutional: Activity,
};

/* ── Condition Row ───────────────────────────────────────────── */

function ConditionRow({
  condition,
  index,
  columns,
  onChange,
  onRemove,
  isOnly,
}: {
  condition: ScannerCondition;
  index: number;
  columns: { column: string; display_name: string; type: string }[];
  onChange: (
    index: number,
    field: keyof ScannerCondition,
    value: string | number
  ) => void;
  onRemove: (index: number) => void;
  isOnly: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        flexWrap: "wrap",
      }}
    >
      {/* Logical operator */}
      {index > 0 ? (
        <select
          className="select"
          value={condition.logical}
          onChange={(e) => onChange(index, "logical", e.target.value)}
          style={{ width: 64 }}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      ) : (
        <div style={{ width: 64, fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
          WHERE
        </div>
      )}

      {/* Column */}
      <select
        className="select"
        value={condition.column}
        onChange={(e) => onChange(index, "column", e.target.value)}
        style={{ flex: 1, height: 32 }}
      >
        <option value="">Select column...</option>
        {columns.map((col) => (
          <option key={col.column} value={col.column}>
            {col.display_name}
          </option>
        ))}
      </select>

      {/* Operator */}
      <select
        className="select"
        value={condition.operator}
        onChange={(e) => onChange(index, "operator", e.target.value)}
        style={{ width: 80 }}
      >
        {OPERATORS.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      {/* Value */}
      <input
        type="text"
        className="input"
        value={String(condition.value)}
        onChange={(e) => onChange(index, "value", e.target.value)}
        placeholder="Value"
        style={{ width: 100, height: 32 }}
      />

      {/* Remove */}
      <button
        className="btn btn-ghost btn-icon"
        onClick={() => onRemove(index)}
        disabled={isOnly}
        style={{ opacity: isOnly ? 0.3 : 1 }}
        title="Remove condition"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}



/* ── Active Filter Chips ─────────────────────────────────────── */

function FilterChips({
  conditions,
  onRemove,
}: {
  conditions: ScannerCondition[];
  onRemove: (index: number) => void;
}) {
  const active = conditions.filter((c) => c.column && c.value !== "");
  if (!active.length) return null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
      {conditions.map((c, idx) => {
        if (!c.column || c.value === "") return null;
        return (
          <span
            key={idx}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 24,
              padding: "0 8px",
              backgroundColor: "var(--color-accent-light)",
              border: "1px solid rgba(255,107,0,0.2)",
              borderRadius: "var(--radius-xs)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-accent)",
            }}
          >
            {idx > 0 && (
              <span style={{ opacity: 0.6, marginRight: 2 }}>
                {c.logical}
              </span>
            )}
            {c.column} {c.operator} {String(c.value)}
            <button
              onClick={() => onRemove(idx)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={10} />
            </button>
          </span>
        );
      })}
    </div>
  );
}

/* ── Summary Cards ───────────────────────────────────────────── */

function ScanSummary({
  results,
  totalScanned,
  isLive,
  liveUpdateCount,
  lastUpdated,
  matchedCount,
}: {
  results: StockRecord[];
  totalScanned: number;
  isLive: boolean;
  liveUpdateCount: number;
  lastUpdated: Date | null;
  matchedCount: number;
}) {
  const bullish = results.filter(
    (s) => typeof s.day_change_pct === "number" && (s.day_change_pct as number) > 0
  ).length;
  const bearish = results.filter(
    (s) => typeof s.day_change_pct === "number" && (s.day_change_pct as number) < 0
  ).length;

  return (
    <div style={{ display: "flex", gap: "var(--sp-3)", flexWrap: "wrap" }}>
      <div className="card-compact" style={{ minWidth: 120 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
          Scanned
        </span>
        <span className="font-tabular" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
          {totalScanned.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="card-compact" style={{ minWidth: 120 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
          Matched
        </span>
        <span className="font-tabular" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-accent)" }}>
          {matchedCount.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="card-compact" style={{ minWidth: 120 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
          Bullish
        </span>
        <span className="font-tabular" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-positive)" }}>
          {bullish.toLocaleString("en-IN")}
        </span>
      </div>
      <div className="card-compact" style={{ minWidth: 120 }}>
        <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
          Bearish
        </span>
        <span className="font-tabular" style={{ fontSize: 18, fontWeight: 700, color: "var(--color-negative)" }}>
          {bearish.toLocaleString("en-IN")}
        </span>
      </div>
      {isLive && (
        <div className="card-compact" style={{ minWidth: 140 }}>
          <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "var(--color-live)",
                boxShadow: "0 0 6px var(--color-live-glow)",
                animation: "pulse-live 2s ease-in-out infinite",
                display: "inline-block",
              }}
            />
            Live Updates
          </span>
          <span className="font-tabular" style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
            {liveUpdateCount} cycles
            {lastUpdated && (
              <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>
                {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────── */

const DEFAULT_CONDITION: ScannerCondition = {
  column: "",
  operator: ">",
  value: "",
  logical: "AND",
};

export default function ScannerPage() {
  const { metadata, pageSize } = useColumnStore();
  const [conditions, setConditions] = useState<ScannerCondition[]>([
    { ...DEFAULT_CONDITION },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [queryBuilderOpen, setQueryBuilderOpen] = useState(false);
  const [initialBuilderQuery, setInitialBuilderQuery] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [sorting, setSorting] = useState<import("@tanstack/react-table").SortingState>([]);
  const tableRef = useRef<DynamicTableRef>(null);

  // Scanner store for results and live state
  const {
    results,
    meta,
    isLive,
    hasRun,
    isLoading: scannerLoading,
    liveUpdateCount,
    lastUpdated,
    activeConditions,
    activeRequest,
    setResults,
    setActiveConditions,
    setActiveRequest,
    executeLive,
    setLive,
    setLoading,
    setError,
    reset: resetScanner,
    loadedPresetId,
    loadedPresetName,
    isModified,
    setLoadedPreset,
    checkModified,
  } = useScannerStore();

  const { stocks, version } = useMarketStore();

  // Re-run executeLive on every new snapshot
  useEffect(() => {
    if (isLive && activeRequest) {
      executeLive(stocks, activeRequest);
    }
  }, [version, isLive, activeRequest, stocks, executeLive]);

  // Use the store's sendMessage to send WS subscription messages
  // without creating a second WebSocket connection
  const { sendMessage } = useWebSocketStore();

  const handleDownloadCSV = () => {
    tableRef.current?.downloadCSV(
      `marketpulse_scan_${new Date().toISOString().split("T")[0]}.csv`
    );
  };

  const filterableColumns = metadata
    .filter((m) => m.filterable)
    .map((m) => ({ column: m.column, display_name: m.display_name, type: m.type }));

  const presetsQuery = useQuery({
    queryKey: ["scanner-presets"],
    queryFn: async () => {
      const res = await fetchScannerPresets();
      return res.data || [];
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (request: import("@/types/scanner").UnifiedQueryRequest) => {
      const res = await runScanner(request as any);
      return { data: res.data || [], meta: (res as any).meta, request };
    },
    onSuccess: (result) => {
      const totalScanned = result.meta?.total || result.data.length;
      setResults(result.data, result.meta || {
        total: result.data.length,
        page: 1,
        page_size: result.data.length,
        total_pages: 1,
        conditions_applied: 0,
      });
      setCurrentPage(1);

      // Enable live mode and store the request for the WebSocket effect
      const validConditions = conditions.filter((c) => c.column && c.value !== "");
      if (validConditions.length > 0 || result.request.query_text) {
        if (validConditions.length > 0) {
          setActiveConditions(validConditions);
        }
        
        if (result.request.execution_target === "live") {
          setLive(true);
        }
        
        setActiveRequest({
          ...result.request,
          sort_by: result.request.sort_by || sorting[0]?.id || undefined,
          sort_order: result.request.sort_order || (sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined),
        });
      }
    },
  });

  const wsStatus = useWebSocketStore((s) => s.status);

  useEffect(() => {
    console.log("[LIFECYCLE] ScannerPage mounted");
    return () => {
      console.log("[LIFECYCLE] ScannerPage unmounted");
    }
  }, []);

  // Subscribe if live mode is active when component mounts or reconnects
  useEffect(() => {
    if (isLive && activeRequest && wsStatus === "connected") {
      sendMessage({
        type: "subscribe_scanner",
        request: activeRequest,
      });
    }
  }, [isLive, activeRequest, wsStatus, sendMessage]);

  const evaluateModification = (nextConditions: ScannerCondition[]) => {
    checkModified({
      execution_target: "live",
      conditions: nextConditions,
      sort_by: sorting[0]?.id || undefined,
      sort_order: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
      page: 1,
      page_size: pageSize || 5000,
    });
  };

  const handleConditionChange = useCallback(
    (index: number, field: keyof ScannerCondition, value: string | number) => {
      setConditions((prev) => {
        const next = [...prev];
        if (field === "value" && NUMERIC_OPS.includes(next[index].operator)) {
          const num = Number(value);
          next[index] = { ...next[index], [field]: isNaN(num) ? value : num };
        } else {
          next[index] = { ...next[index], [field]: value };
        }
        setTimeout(() => evaluateModification(next), 0);
        return next;
      });
    },
    [checkModified, sorting, pageSize]
  );

  const addCondition = () =>
    setConditions((prev) => {
      const next = [...prev, { ...DEFAULT_CONDITION }];
      setTimeout(() => evaluateModification(next), 0);
      return next;
    });

  const removeCondition = (index: number) =>
    setConditions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setTimeout(() => evaluateModification(next), 0);
      return next;
    });

  const resetConditions = () => {
    setConditions([{ ...DEFAULT_CONDITION }]);
    setSorting([]);
    resetScanner();
    // Unsubscribe from live scanner updates
    sendMessage({ type: "unsubscribe_scanner" });
  };

  const stopLive = () => {
    setLive(false);
    sendMessage({ type: "unsubscribe_scanner" });
  };

  const runScan = () => {
    const valid = conditions.filter((c) => c.column && c.value !== "");
    if (!valid.length && !initialBuilderQuery) return;
    setLoading(true);
    
    const request: import("@/types/scanner").UnifiedQueryRequest = {
      execution_target: "live",
      conditions: valid.length > 0 ? valid : undefined,
      query_text: !valid.length && initialBuilderQuery ? initialBuilderQuery : undefined,
      sort_by: sorting[0]?.id || undefined,
      sort_order: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
      page: 1,
      page_size: 5000,
    };
    
    queryMutation.mutate(request);
  };

  const applyPreset = (preset: ScannerPreset) => {
    setLoadedPreset(preset);

    const presetConditions = preset.request?.conditions || (preset as any).conditions || [];
    
    if (presetConditions && presetConditions.length > 0) {
      setConditions(presetConditions);
    } else {
      setConditions([{ ...DEFAULT_CONDITION }]);
    }

    if (preset.request) {
      setActiveRequest(preset.request);
      
      if (preset.request.query_text) {
        setInitialBuilderQuery(preset.request.query_text);
        setQueryBuilderOpen(true);
      }
    }

    if (preset.sorting) {
      setSorting(preset.sorting);
    }
    if (preset.page_size) {
      useColumnStore.getState().setPageSize(preset.page_size);
    }
    if (preset.selected_columns) {
      useColumnStore.getState().setVisibleColumns(preset.selected_columns);
    }

    setLoading(true);
    queryMutation.mutate({
      execution_target: "live",
      conditions: presetConditions.length > 0 ? presetConditions : undefined,
      query_text: preset.request?.query_text || undefined,
      sort_by: preset.sorting?.[0]?.id || sorting[0]?.id || undefined,
      sort_order: preset.sorting?.[0]?.desc !== undefined ? (preset.sorting[0].desc ? "desc" : "asc") : (sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined),
      page: 1,
      page_size: 5000,
    });
  };

  const handleEditConditions = (preset: ScannerPreset) => {
    setLoadedPreset(preset);
    const conditions = preset.request?.conditions || (preset as any).conditions || [];
    if (conditions.length > 0) {
      setConditions(conditions);
    } else {
      setConditions([{ ...DEFAULT_CONDITION }]);
    }
    
    let qText = preset.request?.query_text;
    if (!qText && conditions.length > 0) {
      qText = conditions.map((c: ScannerCondition) => `${c.column} ${c.operator} ${c.value}`).join(" AND ");
    }
    setInitialBuilderQuery(qText || "");
    setQueryBuilderOpen(true);
  };

  // Unsubscribe on unmount
  useEffect(() => {
    return () => {
      sendMessage({ type: "unsubscribe_scanner" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trigger scan when sorting changes if it has run before
  useEffect(() => {
    if (hasRun) {
      if (isLive && activeRequest) {
        // If live, updating activeRequest triggers a new websocket subscription
        setActiveRequest({
          ...activeRequest,
          sort_by: sorting[0]?.id || undefined,
          sort_order: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
        });
      } else if (activeRequest) {
        // If not live, manually fire the query
        setLoading(true);
        queryMutation.mutate({
          ...activeRequest,
          sort_by: sorting[0]?.id || undefined,
          sort_order: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
          page: 1,
          page_size: 5000,
        });
      } else {
        runScan();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const hasValidConditions = conditions.some(
    (c) => c.column && c.value !== ""
  );

  const totalScanned = meta?.total_scanned || meta?.total || results.length;

  const queryMutation = useMutation({
    mutationFn: async (request: import("@/types/scanner").UnifiedQueryRequest) => {
      const { runQuery } = await import("@/services/data");
      const res = await runQuery(request);
      return { data: res.data || [], meta: (res as any).meta, request };
    },
    onSuccess: (result) => {
      setResults(result.data, result.meta || {
        total: result.data.length,
        total_scanned: result.data.length,
        page: 1,
        page_size: result.data.length,
        total_pages: 1,
        conditions_applied: 0,
      });
      setCurrentPage(1);
      
      if (result.request.execution_target === "live") {
        setLive(true);
        setActiveRequest(result.request);
      }
    },
  });

  const handleQueryBuilderExecute = useCallback(
    (queryText: string, target: "live" | "history", date?: string, conditions?: import("@/types/scanner").ScannerCondition[]) => {
      queryMutation.mutate({
        query_text: queryText,
        conditions: conditions,
        execution_target: target,
        date: date,
        sort_by: sorting[0]?.id || undefined,
        sort_order: sorting[0] ? (sorting[0].desc ? "desc" : "asc") : undefined,
        page: 1,
        page_size: 5000, // Fetch up to the backend limit for local pagination
      });
    },
    [queryMutation]
  );

  const handleUpdatePresetFromBuilder = useCallback((queryText: string, conditions: ScannerCondition[]) => {
    const request: import("@/types/scanner").UnifiedQueryRequest = {
      query_text: queryText,
      conditions: conditions,
      execution_target: "live",
      page: 1,
      page_size: pageSize || 5000,
    };
    setActiveRequest(request);
    checkModified(request);
    setSaveModalOpen(true);
  }, [pageSize, checkModified]);

  const handleSaveAsNewFromBuilder = useCallback((queryText: string, conditions: ScannerCondition[]) => {
    const request: import("@/types/scanner").UnifiedQueryRequest = {
      query_text: queryText,
      conditions: conditions,
      execution_target: "live",
      page: 1,
      page_size: pageSize || 5000,
    };
    setActiveRequest(request);
    resetScanner(); // Resets loaded preset so modal opens in 'new' mode
    setSaveModalOpen(true);
  }, [pageSize, resetScanner]);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title="Market Scanner MoM" />

      {/* Query Builder Modal */}
      <QueryBuilder
        isOpen={queryBuilderOpen}
        onClose={() => setQueryBuilderOpen(false)}
        onExecute={handleQueryBuilderExecute}
        initialQuery={initialBuilderQuery}
        showPresetControls={!!loadedPresetId}
        onUpdatePreset={handleUpdatePresetFromBuilder}
        onSaveAsNew={handleSaveAsNewFromBuilder}
      />

      <SaveQueryModal 
        isOpen={saveModalOpen} 
        onClose={() => setSaveModalOpen(false)} 
        request={activeRequest}
        scannerType="live"
        sorting={sorting}
        pageSize={pageSize}
        selectedColumns={useColumnStore.getState().visibleColumns}
        loadedPresetId={loadedPresetId}
        loadedPresetName={loadedPresetName}
        isModified={isModified}
        onUpdateSuccess={() => {
          if (activeRequest) {
            checkModified(activeRequest);
          }
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="app-content"
        style={{ padding: "var(--sp-6)" }}
      >
        {loadedPresetName && (
          <div style={{ 
            padding: "var(--sp-3) var(--sp-4)", 
            backgroundColor: "var(--bg-secondary)", 
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--sp-5)",
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            fontSize: 13
          }}>
            <span style={{ color: "var(--text-secondary)" }}>Current Preset:</span>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{loadedPresetName}</span>
            {isModified && (
              <span style={{ 
                color: "var(--color-warning)", 
                display: "flex", 
                alignItems: "center", 
                gap: 4,
                marginLeft: "var(--sp-2)",
                fontSize: 12,
                fontWeight: 500
              }}>
                ● Modified
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
          {/* Presets */}
          {presetsQuery.data && presetsQuery.data.length > 0 && (
            <div style={{ marginBottom: "var(--sp-2)" }}>
              <h3
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  marginBottom: "var(--sp-3)",
                }}
              >
                Quick Presets
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: "var(--sp-3)",
                  overflowX: "auto",
                  paddingBottom: "var(--sp-1)",
                }}
              >
                {presetsQuery.data.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onSelect={applyPreset}
                    onEditConditions={handleEditConditions}
                  />
                ))}
              </div>
            </div>
          )}

          <MyPresetsList scannerType="live" onSelect={applyPreset} onEditConditions={handleEditConditions} />

          {/* Condition Builder */}
          <div className="card" style={{ padding: "var(--sp-5)" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "var(--sp-4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <ScanSearch size={16} style={{ color: "var(--color-accent)" }} />
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Build Conditions
                </h3>
                {isLive && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      height: 20,
                      padding: "0 8px",
                      backgroundColor: "rgba(0,200,83,0.1)",
                      border: "1px solid rgba(0,200,83,0.3)",
                      borderRadius: "var(--radius-xs)",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--color-live)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    <Radio size={8} />
                    LIVE
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexShrink: 0 }}>
                {isLive && (
                  <button
                    className="btn btn-ghost"
                    onClick={stopLive}
                    title="Stop live updates"
                    style={{ color: "var(--color-negative)" }}
                  >
                    <Square size={12} />
                    Stop Live
                  </button>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={resetConditions}
                  title="Reset all"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={addCondition}
                >
                  <Plus size={14} />
                  Add Condition
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setQueryBuilderOpen(true)}
                  title="Open advanced query builder"
                >
                  <Sparkles size={13} />
                  Create Screener
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setSaveModalOpen(true)}
                  title="Save current conditions as a preset"
                  disabled={!activeRequest}
                >
                  <Save size={13} />
                  Save Query
                </button>
                <button
                  className="btn btn-primary"
                  onClick={runScan}
                  disabled={scanMutation.isPending || !hasValidConditions}
                >
                  <Play size={13} />
                  {scanMutation.isPending ? "Scanning..." : "Run Scan"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
              {conditions.map((condition, idx) => (
                <ConditionRow
                  key={idx}
                  condition={condition}
                  index={idx}
                  columns={filterableColumns}
                  onChange={handleConditionChange}
                  onRemove={removeCondition}
                  isOnly={conditions.length === 1}
                />
              ))}
            </div>
          </div>

          {/* Active filter chips */}
          <FilterChips conditions={conditions} onRemove={removeCondition} />

          {/* Results */}
          {hasRun && results.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <ScanSummary
                results={results}
                totalScanned={totalScanned}
                isLive={isLive}
                liveUpdateCount={liveUpdateCount}
                lastUpdated={lastUpdated}
                matchedCount={meta?.matched_count ?? meta?.total ?? results.length}
              />
              
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
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
              </div>
            </div>
          )}

          {scanMutation.isError || queryMutation.isError ? (
            <ErrorState
              title="Scan Failed"
              message="The scanner encountered an error. Please check your conditions and try again."
              onRetry={runScan}
            />
          ) : results.length > 0 ? (
            <>
              <DynamicTable
                ref={tableRef}
                data={results}
                globalFilter=""
                pagination={{
                  pageIndex: currentPage - 1,
                  pageSize: pageSize,
                }}
                sorting={sorting}
                onSortingChange={setSorting}
                manualSorting={true}
                isFetching={scanMutation.isPending || queryMutation.isPending || scannerLoading}
              />
              <Pagination
                currentPage={currentPage}
                totalItems={results.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={() => {}}
              />
            </>
          ) : scanMutation.isPending || queryMutation.isPending || scannerLoading ? (
            <SkeletonTable rows={6} cols={6} />
          ) : hasRun ? (
            <EmptyState
              icon={ScanSearch}
              title="No stocks matched"
              message="No stocks currently satisfy the selected conditions. Try adjusting your filters."
              action="Reset Conditions"
              onAction={resetConditions}
            />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
