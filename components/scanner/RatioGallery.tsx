"use client";

/**
 * RatioGallery — Dynamic column gallery for the Query Builder.
 *
 * Displays all filterable columns from metadata, grouped by category.
 * Click a column to insert it at the cursor position in the query editor.
 * Supports instant search filtering.
 */

import { useState, useMemo } from "react";
import { useColumnStore } from "@/stores/columns";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { getDataTypeIcon } from "@/utils/icons";

interface RatioGalleryProps {
  onSelect: (columnName: string) => void;
  storeHook?: typeof useColumnStore;
}

export function RatioGallery({ onSelect, storeHook }: RatioGalleryProps) {
  const useStore = storeHook || useColumnStore;
  const { metadata } = useStore();
  const [search, setSearch] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const filterableColumns = useMemo(() => {
    return metadata.filter((m) => m.filterable);
  }, [metadata]);

  const grouped = useMemo(() => {
    const groups: Record<string, typeof filterableColumns> = {};
    const lower = search.toLowerCase();

    for (const col of filterableColumns) {
      if (lower && !col.column.toLowerCase().includes(lower) && !col.display_name.toLowerCase().includes(lower)) {
        continue;
      }
      const group = col.group || "Other";
      if (!groups[group]) groups[group] = [];
      groups[group].push(col);
    }

    // Sort groups alphabetically but keep "Core" first
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Core") return -1;
      if (b === "Core") return 1;
      return a.localeCompare(b);
    });

    return sortedKeys.map((key) => ({
      name: key,
      columns: groups[key],
    }));
  }, [filterableColumns, search]);

  const toggleGroup = (name: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const totalCount = grouped.reduce((sum, g) => sum + g.columns.length, 0);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--border-primary)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "var(--sp-3) var(--sp-4)",
          borderBottom: "1px solid var(--border-primary)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginBottom: "var(--sp-2)",
          }}
        >
          Columns ({totalCount})
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={12}
            style={{
              position: "absolute",
              left: 8,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter columns..."
            style={{ width: "100%", paddingLeft: 28, height: 28, fontSize: 11 }}
          />
        </div>
      </div>

      {/* Groups */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--sp-2) 0",
        }}
      >
        {grouped.length === 0 && (
          <div
            style={{
              padding: "var(--sp-4)",
              textAlign: "center",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            No columns match &ldquo;{search}&rdquo;
          </div>
        )}

        {grouped.map((group) => {
          const isCollapsed = collapsedGroups.has(group.name);
          return (
            <div key={group.name}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  width: "100%",
                  padding: "4px var(--sp-3)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
                {group.name}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  ({group.columns.length})
                </span>
              </button>

              {/* Column items */}
              {!isCollapsed && (
                <div style={{ padding: "0 var(--sp-2)" }}>
                  {group.columns.map((col) => (
                    <button
                      key={col.column}
                      onClick={() => onSelect(col.column)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "3px var(--sp-2)",
                        background: "none",
                        border: "none",
                        borderRadius: "var(--radius-xs)",
                        cursor: "pointer",
                        fontSize: 11,
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-mono)",
                        textAlign: "left",
                        transition: "background var(--transition-fast)",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                      title={`${col.display_name} (${col.type})`}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {col.column}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--text-muted)",
                          flexShrink: 0,
                          marginLeft: 4,
                        }}
                      >
                        {getDataTypeIcon(col.type)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
