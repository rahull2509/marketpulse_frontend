"use client";

import { useState, useEffect, useRef } from "react";
import { useColumnStore } from "@/stores/columns";
import {
  Columns3,
  X,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Check,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      width="10"
      height="10"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function ColumnSelector() {
  const {
    metadata,
    groups,
    visibleColumns,
    toggleColumn,
    resetToDefaults,
    selectGroup,
    deselectGroup,
  } = useColumnStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups)
  );
  const [searchQuery, setSearchQuery] = useState("");

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
    const selected = groupCols.filter((m) =>
      visibleColumns.includes(m.column)
    );
    return selected.length > 0 && selected.length < groupCols.length;
  };

  if (!metadata.length) return null;

  const filteredMetadata = searchQuery
    ? metadata.filter(
        (m) =>
          m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.column.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : metadata;

  const filteredGroups = searchQuery
    ? [...new Set(filteredMetadata.map((m) => m.group))]
    : groups;

  return (
    <>
      {/* Trigger Button */}
      <button
        className="btn btn-secondary"
        onClick={() => setIsOpen(true)}
      >
        <Columns3 size={14} />
        Columns ({visibleColumns.length})
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              className="drawer-panel"
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              exit={{ x: 320 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="drawer-header">
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Columns
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={resetToDefaults}
                    title="Reset to defaults"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div
                style={{
                  padding: "var(--sp-3) var(--sp-4)",
                  borderBottom: "1px solid var(--border-primary)",
                }}
              >
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search columns..."
                    className="input"
                    style={{
                      width: "100%",
                      height: 32,
                      fontSize: 12,
                      paddingLeft: 32,
                    }}
                  />
                </div>
              </div>

              {/* Groups */}
              <div className="drawer-body">
                {filteredGroups.map((group) => {
                  const groupColumns = filteredMetadata.filter(
                    (m) => m.group === group
                  );
                  if (groupColumns.length === 0) return null;
                  const isExpanded = expandedGroups.has(group);
                  const isFull = isGroupFullySelected(group);
                  const isPartial = isGroupPartiallySelected(group);

                  return (
                    <div key={group} style={{ marginBottom: 4 }}>
                      {/* Group header */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "6px 8px",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          transition: "background var(--transition-fast)",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bg-hover)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "transparent";
                        }}
                        onClick={() => toggleGroup(group)}
                      >
                        {isExpanded ? (
                          <ChevronDown
                            size={12}
                            style={{ color: "var(--text-muted)" }}
                          />
                        ) : (
                          <ChevronRight
                            size={12}
                            style={{ color: "var(--text-muted)" }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-secondary)",
                            flex: 1,
                          }}
                        >
                          {group}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--text-muted)",
                          }}
                        >
                          {
                            groupColumns.filter((m) =>
                              visibleColumns.includes(m.column)
                            ).length
                          }
                          /{groupColumns.length}
                        </span>
                        {/* Group toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFull) deselectGroup(group);
                            else selectGroup(group);
                          }}
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: "var(--radius-xs)",
                            border: `1px solid ${
                              isFull
                                ? "var(--color-accent)"
                                : isPartial
                                ? "var(--color-accent)"
                                : "var(--border-secondary)"
                            }`,
                            backgroundColor: isFull
                              ? "var(--color-accent)"
                              : isPartial
                              ? "var(--color-accent-bg)"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                            padding: 0,
                          }}
                        >
                          {isFull && (
                            <Check size={10} color="#ffffff" />
                          )}
                          {isPartial && !isFull && (
                            <MinusIcon />
                          )}
                        </button>
                      </div>

                      {/* Individual columns */}
                      {isExpanded && (
                        <div style={{ marginLeft: 20, marginTop: 2 }}>
                          {groupColumns.map((col) => {
                            const isVisible = visibleColumns.includes(
                              col.column
                            );
                            return (
                              <div
                                key={col.column}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "5px 8px",
                                  borderRadius: "var(--radius-sm)",
                                  cursor: "pointer",
                                  transition:
                                    "background var(--transition-fast)",
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "var(--bg-hover)";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }}
                                onClick={() => toggleColumn(col.column)}
                              >
                                <div
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "var(--radius-xs)",
                                    border: `1px solid ${
                                      isVisible
                                        ? "var(--color-accent)"
                                        : "var(--border-secondary)"
                                    }`,
                                    backgroundColor: isVisible
                                      ? "var(--color-accent)"
                                      : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    transition:
                                      "all var(--transition-fast)",
                                  }}
                                >
                                  {isVisible && (
                                    <Check size={9} color="#ffffff" />
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: "var(--text-secondary)",
                                    flex: 1,
                                  }}
                                >
                                  {col.display_name}
                                </span>
                                {col.unit && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {col.unit}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
