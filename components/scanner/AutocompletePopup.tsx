import React, { memo, useEffect, useRef } from "react";
import type { ColumnMetadata } from "@/types/metadata";
import { getDataTypeIcon } from "@/utils/icons";

interface AutocompletePopupProps {
  suggestions: ColumnMetadata[];
  selectedIndex: number;
  onHover: (index: number) => void;
  onClick: (index: number) => void;
}

export const AutocompletePopup = memo(function AutocompletePopup({
  suggestions,
  selectedIndex,
  onHover,
  onClick
}: AutocompletePopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        const container = listRef.current;
        const elementTop = activeElement.offsetTop;
        const elementBottom = elementTop + activeElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;

        if (elementTop < containerTop || elementBottom > containerBottom) {
          activeElement.scrollIntoView({ block: "nearest" });
        }
      }
    }
  }, [selectedIndex]);

  return (
    <div
      id="autocomplete-list"
      ref={listRef}
      role="listbox"
      className="card"
      style={{
        position: "absolute",
        zIndex: 1000,
        backgroundColor: "var(--bg-primary)",
        border: "1px solid var(--border-primary)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-md)",
        maxHeight: 296, // 10 items * 28px + 16px padding
        overflowY: "auto",
        padding: "var(--sp-2)",
        minWidth: 240,
      }}
    >
      {suggestions.map((col, index) => (
        <div
          key={col.column}
          id={`suggestion-${index}`}
          role="option"
          aria-selected={index === selectedIndex}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 8px",
            height: 28,
            cursor: "default",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-primary)",
            borderRadius: "var(--radius-xs)",
            backgroundColor: index === selectedIndex ? "var(--bg-hover)" : "transparent",
            transition: "background var(--transition-fast)",
          }}
          onMouseEnter={() => {
            if (typeof onHover === 'function') onHover(index);
          }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            if (e.button === 0 && typeof onClick === 'function') onClick(index);
          }}
        >
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {col.column}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--text-muted)",
              flexShrink: 0,
              marginLeft: 8,
              fontWeight: 500,
            }}
          >
            {getDataTypeIcon(col.type)}
          </span>
        </div>
      ))}
    </div>
  );
});
