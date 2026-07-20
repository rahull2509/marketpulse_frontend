"use client";

import { useColumnStore } from "@/stores/columns";

export function PageSizeSelector() {
  const { pageSize, setPageSize } = useColumnStore();

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
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={250}>250</option>
      </select>
    </div>
  );
}
