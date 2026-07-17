"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { TopNavigation } from "@/components/layout/TopNavigation";
import { DynamicTable } from "@/components/dashboard/DynamicTable";
import { Pagination } from "@/components/common/Pagination";
import {
  EmptyState,
  SkeletonTable,
  ErrorState,
} from "@/components/common/States";
import { useColumnStore } from "@/stores/columns";
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

/* ── Preset Card ─────────────────────────────────────────────── */

function PresetCard({
  preset,
  onSelect,
}: {
  preset: ScannerPreset;
  onSelect: (preset: ScannerPreset) => void;
}) {
  const nameLower = preset.name.toLowerCase();
  let Icon = PRESET_ICONS.default;
  if (nameLower.includes("bull")) Icon = PRESET_ICONS.bullish;
  else if (nameLower.includes("bear")) Icon = PRESET_ICONS.bearish;
  else if (nameLower.includes("volume")) Icon = PRESET_ICONS.volume;
  else if (nameLower.includes("momentum")) Icon = PRESET_ICONS.momentum;
  else if (nameLower.includes("institution")) Icon = PRESET_ICONS.institutional;

  return (
    <button
      onClick={() => onSelect(preset)}
      className="card"
      style={{
        padding: "var(--sp-3) var(--sp-4)",
        textAlign: "left",
        cursor: "pointer",
        minWidth: 160,
        flex: "0 0 auto",
        border: "1px solid var(--border-primary)",
        transition: "all var(--transition-fast)",
        background: "none",
        fontFamily: "var(--font-sans)",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = "var(--color-accent)";
        e.currentTarget.style.backgroundColor = "var(--color-accent-light)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = "var(--border-primary)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          marginBottom: 4,
        }}
      >
        <Icon size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-primary)",
          }}
        >
          {preset.name}
        </span>
      </div>
      <p
        style={{
          fontSize: 11,
          color: "var(--text-tertiary)",
          lineHeight: 1.4,
        }}
      >
        {preset.description}
      </p>
      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          marginTop: 4,
          display: "block",
        }}
      >
        {preset.conditions.length} condition
        {preset.conditions.length !== 1 ? "s" : ""}
      </span>
    </button>
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
}: {
  results: StockRecord[];
  totalScanned: number;
}) {
  const bullish = results.filter(
    (s) => typeof s.day_change_pct === "number" && (s.day_change_pct as number) > 0
  ).length;
  const bearish = results.filter(
    (s) => typeof s.day_change_pct === "number" && (s.day_change_pct as number) < 0
  ).length;

  return (
    <div style={{ display: "flex", gap: "var(--sp-3)" }}>
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
          {results.length.toLocaleString("en-IN")}
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
  const { metadata } = useColumnStore();
  const [conditions, setConditions] = useState<ScannerCondition[]>([
    { ...DEFAULT_CONDITION },
  ]);
  const [results, setResults] = useState<StockRecord[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalScanned, setTotalScanned] = useState(0);

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
    mutationFn: async (request: ScannerRequest) => {
      const res = await runScanner(request);
      return res.data || [];
    },
    onSuccess: (data, variables) => {
      setResults(data);
      setHasRun(true);
      setCurrentPage(1);
    },
  });

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
        return next;
      });
    },
    []
  );

  const addCondition = () =>
    setConditions((prev) => [...prev, { ...DEFAULT_CONDITION }]);

  const removeCondition = (index: number) =>
    setConditions((prev) => prev.filter((_, i) => i !== index));

  const resetConditions = () => {
    setConditions([{ ...DEFAULT_CONDITION }]);
    setResults([]);
    setHasRun(false);
  };

  const runScan = () => {
    const valid = conditions.filter((c) => c.column && c.value !== "");
    if (!valid.length) return;
    scanMutation.mutate({
      mode: "live",
      conditions: valid,
      sort_by: "day_change_pct",
      sort_order: "desc",
      page: 1,
      page_size: 500,
    });
  };

  const applyPreset = (preset: ScannerPreset) => {
    setConditions(preset.conditions);
    scanMutation.mutate({
      mode: "live",
      conditions: preset.conditions,
      sort_by: "day_change_pct",
      sort_order: "desc",
      page: 1,
      page_size: 500,
    });
  };

  const hasValidConditions = conditions.some(
    (c) => c.column && c.value !== ""
  );

  // Paginate results client-side
  const paginatedResults = results.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <TopNavigation title="Condition Scanner" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="app-content"
        style={{ padding: "var(--sp-6)" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>
          {/* Presets */}
          {presetsQuery.data && presetsQuery.data.length > 0 && (
            <div>
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
                  />
                ))}
              </div>
            </div>
          )}

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
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
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
            <ScanSummary results={results} totalScanned={7000} />
          )}

          {scanMutation.isPending ? (
            <SkeletonTable rows={6} cols={6} />
          ) : scanMutation.isError ? (
            <ErrorState
              title="Scan Failed"
              message="The scanner encountered an error. Please check your conditions and try again."
              onRetry={runScan}
            />
          ) : results.length > 0 ? (
            <>
              <DynamicTable data={paginatedResults} globalFilter="" />
              <Pagination
                currentPage={currentPage}
                totalItems={results.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </>
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
