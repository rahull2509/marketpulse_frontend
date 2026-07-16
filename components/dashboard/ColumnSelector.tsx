"use client";

import { useState } from "react";
import { useColumnStore } from "@/stores/columns";
import { Columns3, X, RotateCcw, ChevronDown, ChevronRight, Check } from "lucide-react";

export function ColumnSelector() {
  const { metadata, groups, visibleColumns, toggleColumn, resetToDefaults, selectGroup, deselectGroup } =
    useColumnStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(groups));

  const toggleGroup = (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const isGroupFullySelected = (group: string) => {
    const groupCols = metadata.filter((m) => m.group === group);
    return groupCols.every((m) => visibleColumns.includes(m.column));
  };

  const isGroupPartiallySelected = (group: string) => {
    const groupCols = metadata.filter((m) => m.group === group);
    const selected = groupCols.filter((m) => visibleColumns.includes(m.column));
    return selected.length > 0 && selected.length < groupCols.length;
  };

  if (!metadata.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          borderColor: "var(--border-secondary)",
          color: "var(--text-secondary)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <Columns3 className="h-3.5 w-3.5" />
        Columns ({visibleColumns.length})
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Panel */}
          <div
            className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border shadow-lg"
            style={{
              backgroundColor: "var(--bg-elevated)",
              borderColor: "var(--border-primary)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-4 py-3"
              style={{ borderColor: "var(--border-primary)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Column Selector
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetToDefaults}
                  className="rounded p-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-tertiary)" }}
                  title="Reset to defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Groups */}
            <div className="max-h-80 overflow-y-auto p-2">
              {groups.map((group) => {
                const groupColumns = metadata.filter((m) => m.group === group);
                if (groupColumns.length === 0) return null;
                const isExpanded = expandedGroups.has(group);
                const isFull = isGroupFullySelected(group);
                const isPartial = isGroupPartiallySelected(group);

                return (
                  <div key={group} className="mb-1">
                    {/* Group header */}
                    <button
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)]"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => toggleGroup(group)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      {group}
                      <span className="ml-auto text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {groupColumns.filter((m) => visibleColumns.includes(m.column)).length}/
                        {groupColumns.length}
                      </span>
                      {/* Select/deselect group */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFull) deselectGroup(group);
                          else selectGroup(group);
                        }}
                        className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                          isFull
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                            : isPartial
                            ? "border-[var(--color-accent)] bg-[var(--color-accent-bg)]"
                            : "border-[var(--border-secondary)]"
                        }`}
                      >
                        {isFull && <Check className="h-2.5 w-2.5 text-white" />}
                        {isPartial && !isFull && <Minus className="h-2.5 w-2.5 text-[var(--color-accent)]" />}
                      </button>
                    </button>

                    {/* Individual columns */}
                    {isExpanded && (
                      <div className="ml-5 space-y-0.5">
                        {groupColumns.map((col) => {
                          const isVisible = visibleColumns.includes(col.column);
                          return (
                            <button
                              key={col.column}
                              onClick={() => toggleColumn(col.column)}
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs transition-colors hover:bg-[var(--bg-hover)]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <div
                                className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${
                                  isVisible
                                    ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                                    : "border-[var(--border-secondary)]"
                                }`}
                              >
                                {isVisible && <Check className="h-2 w-2 text-white" />}
                              </div>
                              <span className="flex-1 text-left">{col.display_name}</span>
                              {col.unit && (
                                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                                  {col.unit}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Need Minus icon for partial select state
function Minus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
