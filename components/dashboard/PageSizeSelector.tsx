"use client";

import { useColumnStore } from "@/stores/columns";

interface PageSizeSelectorProps {
  options?: number[];
  storeHook?: typeof useColumnStore;
}

export function PageSizeSelector({ options = [25, 50, 100, 250], storeHook }: PageSizeSelectorProps = {}) {
  const useStore = storeHook || useColumnStore;
  const { pageSize, setPageSize } = useStore();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", flexShrink: 0 }}>
      <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Rows
      </span>
      <select
        className="input"
        value={pageSize}
        onChange={(e) => setPageSize(Number(e.target.value))}
        style={{
          padding: "var(--sp-1) var(--sp-2)",
          height: 32,
          minWidth: 60,
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
