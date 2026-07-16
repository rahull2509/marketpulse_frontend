"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TopBar } from "@/components/layout/TopBar";
import { DynamicTable } from "@/components/dashboard/DynamicTable";
import { LoadingState, EmptyState, SkeletonTable } from "@/components/common/States";
import { useColumnStore } from "@/stores/columns";
import { fetchScannerPresets, runScanner } from "@/services/data";
import type { ScannerCondition, ScannerPreset, ScannerRequest } from "@/types/scanner";
import type { StockRecord } from "@/types/stock";
import type { PaginationMeta } from "@/types/api";
import {
  ScanSearch,
  Plus,
  Trash2,
  Play,
  Bookmark,
  ChevronDown,
} from "lucide-react";

// ── Condition Row ──────────────────────────────────────────────────────

function ConditionRow({
  condition,
  index,
  columns,
  operators,
  onChange,
  onRemove,
}: {
  condition: ScannerCondition;
  index: number;
  columns: { column: string; display_name: string; type: string }[];
  operators: string[];
  onChange: (index: number, field: keyof ScannerCondition, value: string | number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* Logical operator (hidden for first row) */}
      {index > 0 && (
        <select
          value={condition.logical}
          onChange={(e) => onChange(index, "logical", e.target.value)}
          className="w-16 rounded-md border bg-transparent px-2 py-1.5 text-xs"
          style={{
            borderColor: "var(--border-secondary)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </select>
      )}
      {index === 0 && <div className="w-16" />}

      {/* Column */}
      <select
        value={condition.column}
        onChange={(e) => onChange(index, "column", e.target.value)}
        className="flex-1 rounded-md border bg-transparent px-2 py-1.5 text-xs"
        style={{
          borderColor: "var(--border-secondary)",
          color: "var(--text-primary)",
          backgroundColor: "var(--bg-secondary)",
        }}
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
        value={condition.operator}
        onChange={(e) => onChange(index, "operator", e.target.value)}
        className="w-20 rounded-md border bg-transparent px-2 py-1.5 text-xs"
        style={{
          borderColor: "var(--border-secondary)",
          color: "var(--text-primary)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        {operators.map((op) => (
          <option key={op} value={op}>{op}</option>
        ))}
      </select>

      {/* Value */}
      <input
        type="text"
        value={String(condition.value)}
        onChange={(e) => onChange(index, "value", e.target.value)}
        className="w-28 rounded-md border bg-transparent px-2 py-1.5 text-xs"
        style={{
          borderColor: "var(--border-secondary)",
          color: "var(--text-primary)",
        }}
        placeholder="Value"
      />

      {/* Remove */}
      <button
        onClick={() => onRemove(index)}
        className="rounded p-1 transition-colors hover:bg-[var(--color-negative-bg)]"
        style={{ color: "var(--text-tertiary)" }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ── Preset Card ────────────────────────────────────────────────────────

function PresetCard({
  preset,
  onSelect,
}: {
  preset: ScannerPreset;
  onSelect: (preset: ScannerPreset) => void;
}) {
  return (
    <button
      onClick={() => onSelect(preset)}
      className="glass-card flex flex-col gap-1.5 p-3 text-left transition-all hover:scale-[1.02] hover:border-[var(--border-accent)]"
    >
      <div className="flex items-center gap-2">
        <Bookmark className="h-3.5 w-3.5" style={{ color: "var(--color-accent)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          {preset.name}
        </span>
      </div>
      <p className="text-[11px] leading-snug" style={{ color: "var(--text-tertiary)" }}>
        {preset.description}
      </p>
      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
        {preset.conditions.length} condition{preset.conditions.length !== 1 ? "s" : ""}
      </span>
    </button>
  );
}

// ── Main Scanner Page ──────────────────────────────────────────────────

const DEFAULT_CONDITION: ScannerCondition = {
  column: "",
  operator: ">",
  value: "",
  logical: "AND",
};

const OPERATORS = [">", "<", ">=", "<=", "=", "!=", "between", "contains"];

export default function ScannerPage() {
  const { metadata } = useColumnStore();
  const [conditions, setConditions] = useState<ScannerCondition[]>([{ ...DEFAULT_CONDITION }]);
  const [results, setResults] = useState<StockRecord[]>([]);
  const [resultMeta, setResultMeta] = useState<PaginationMeta | null>(null);

  // Filterable columns
  const filterableColumns = metadata
    .filter((m) => m.filterable)
    .map((m) => ({ column: m.column, display_name: m.display_name, type: m.type }));

  // Presets
  const presetsQuery = useQuery({
    queryKey: ["scanner-presets"],
    queryFn: async () => {
      const res = await fetchScannerPresets();
      return res.data;
    },
  });

  // Scanner execution
  const scanMutation = useMutation({
    mutationFn: async (request: ScannerRequest) => {
      const res = await runScanner(request);
      return { data: res.data, meta: (res as { meta?: PaginationMeta }).meta };
    },
    onSuccess: (result) => {
      setResults(result.data || []);
      setResultMeta(result.meta || null);
    },
  });

  const handleConditionChange = useCallback(
    (index: number, field: keyof ScannerCondition, value: string | number) => {
      setConditions((prev) => {
        const next = [...prev];
        // Parse numeric value for numeric operators
        const numericOps = [">", "<", ">=", "<=", "between"];
        if (field === "value" && numericOps.includes(next[index].operator)) {
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

  const addCondition = () => {
    setConditions((prev) => [...prev, { ...DEFAULT_CONDITION }]);
  };

  const removeCondition = (index: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const runScan = () => {
    const validConditions = conditions.filter((c) => c.column && c.value !== "");
    if (!validConditions.length) return;

    scanMutation.mutate({
      mode: "live",
      conditions: validConditions,
      sort_by: "day_change_pct",
      sort_order: "desc",
      page: 1,
      page_size: 200,
    });
  };

  const applyPreset = (preset: ScannerPreset) => {
    setConditions(preset.conditions);
    // Auto-run
    scanMutation.mutate({
      mode: "live",
      conditions: preset.conditions,
      sort_by: "day_change_pct",
      sort_order: "desc",
      page: 1,
      page_size: 200,
    });
  };

  return (
    <div className="flex flex-col">
      <TopBar title="Condition Scanner" />

      <div className="flex flex-col gap-6 p-6">
        {/* Presets */}
        {presetsQuery.data && presetsQuery.data.length > 0 && (
          <div>
            <h3
              className="mb-3 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-tertiary)" }}
            >
              Quick Presets
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {presetsQuery.data.map((preset) => (
                <PresetCard key={preset.id} preset={preset} onSelect={applyPreset} />
              ))}
            </div>
          </div>
        )}

        {/* Condition Builder */}
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              <ScanSearch className="h-4 w-4" style={{ color: "var(--color-accent)" }} />
              Build Scan Conditions
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={addCondition}
                className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
                style={{
                  borderColor: "var(--border-secondary)",
                  color: "var(--text-secondary)",
                }}
              >
                <Plus className="h-3 w-3" />
                Add Condition
              </button>
              <button
                onClick={runScan}
                disabled={scanMutation.isPending || !conditions.some((c) => c.column && c.value !== "")}
                className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition-all disabled:opacity-40"
                style={{ backgroundColor: "var(--color-accent)" }}
              >
                <Play className="h-3 w-3" />
                {scanMutation.isPending ? "Scanning..." : "Run Scan"}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {conditions.map((condition, idx) => (
              <ConditionRow
                key={idx}
                condition={condition}
                index={idx}
                columns={filterableColumns}
                operators={OPERATORS}
                onChange={handleConditionChange}
                onRemove={removeCondition}
              />
            ))}
          </div>
        </div>

        {/* Results */}
        {scanMutation.isPending ? (
          <SkeletonTable rows={5} cols={6} />
        ) : results.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {resultMeta?.total || results.length} stocks matched
              </span>
            </div>
            <DynamicTable data={results} globalFilter="" />
          </div>
        ) : scanMutation.isSuccess ? (
          <EmptyState message="No stocks matched your conditions. Try adjusting the filters." />
        ) : null}
      </div>
    </div>
  );
}
