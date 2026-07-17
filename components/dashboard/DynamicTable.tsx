"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useColumnStore } from "@/stores/columns";
import {
  formatCurrency,
  formatPercent,
  formatVolume,
  formatChange,
  getChangeClass,
} from "@/utils/format";
import type { StockRecord } from "@/types/stock";
import type { ColumnMetadata } from "@/types/metadata";
import Link from "next/link";

/* ── Cell Renderer ────────────────────────────────────────────── */

function renderCell(
  value: unknown,
  meta: ColumnMetadata | undefined
): React.ReactNode {
  if (value === null || value === undefined)
    return (
      <span style={{ color: "var(--text-muted)" }}>—</span>
    );

  const unit = meta?.unit || "";
  const type = meta?.type || "string";
  const column = meta?.column || "";

  if (column === "day_change_pct" || unit === "%") {
    const num = Number(value);
    return (
      <span
        className={`font-tabular ${getChangeClass(num)}`}
        style={{ fontWeight: 500 }}
      >
        {formatPercent(num)}
      </span>
    );
  }

  if (column === "Net Change") {
    const num = Number(value);
    return (
      <span
        className={`font-tabular ${getChangeClass(num)}`}
        style={{ fontWeight: 500 }}
      >
        {formatChange(num)}
      </span>
    );
  }

  if (unit === "₹" && type === "number") {
    return (
      <span className="font-tabular" style={{ fontWeight: 500 }}>
        {formatCurrency(value)}
      </span>
    );
  }

  if (
    column === "Volume" ||
    column === "Total Buy Quantity" ||
    column === "Total Sell Quantity"
  ) {
    return <span className="font-tabular">{formatVolume(value)}</span>;
  }

  if (column === "trading_symbol") {
    return (
      <Link
        href={`/stock/${encodeURIComponent(String(value))}`}
        style={{
          fontWeight: 600,
          color: "var(--text-primary)",
          textDecoration: "none",
          transition: "color var(--transition-fast)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "var(--color-accent)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "var(--text-primary)";
        }}
      >
        {String(value)}
      </Link>
    );
  }

  if (type === "number") {
    const num = Number(value);
    if (!isNaN(num))
      return <span className="font-tabular">{num.toFixed(2)}</span>;
  }

  return <span>{String(value)}</span>;
}

/* ── Sort Icon ────────────────────────────────────────────────── */

function SortIcon({
  isSorted,
}: {
  isSorted: false | "asc" | "desc";
}) {
  if (isSorted === "asc")
    return (
      <ArrowUp size={12} style={{ color: "var(--color-accent)" }} />
    );
  if (isSorted === "desc")
    return (
      <ArrowDown size={12} style={{ color: "var(--color-accent)" }} />
    );
  return (
    <ArrowUpDown
      size={12}
      style={{ color: "var(--text-muted)", opacity: 0.5 }}
    />
  );
}

/* ── Main Table ───────────────────────────────────────────────── */

interface DynamicTableProps {
  data: StockRecord[];
  globalFilter: string;
}

export function DynamicTable({ data, globalFilter }: DynamicTableProps) {
  const { metadata } = useColumnStore();
  const { visibleColumns } = useColumnStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  const metaMap = useMemo(() => {
    const map = new Map<string, ColumnMetadata>();
    metadata.forEach((m) => map.set(m.column, m));
    return map;
  }, [metadata]);

  const columns = useMemo<ColumnDef<StockRecord>[]>(() => {
    return visibleColumns
      .map((colName) => {
        const meta = metaMap.get(colName);
        const displayName = meta?.display_name || colName;
        const type = meta?.type || "string";

        const col: ColumnDef<StockRecord> = {
          id: colName,
          accessorFn: (row) => row[colName],
          header: ({ column: tableCol }) => (
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "none",
                border: "none",
                cursor: "pointer",
                font: "inherit",
                color: "inherit",
                padding: 0,
                fontWeight: 600,
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
              }}
              onClick={() => tableCol.toggleSorting()}
            >
              {displayName}
              <SortIcon isSorted={tableCol.getIsSorted()} />
            </button>
          ),
          cell: ({ getValue }) => renderCell(getValue(), meta),
          sortingFn: type === "number" ? "basic" : "alphanumeric",
          enableSorting: meta?.sortable !== false,
        };

        return col;
      })
      .filter(Boolean);
  }, [visibleColumns, metaMap]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const instrument = String(
        row.original.Instrument || ""
      ).toLowerCase();
      const symbol = String(
        row.original.trading_symbol || ""
      ).toLowerCase();
      const company = String(
        row.original.company_name || ""
      ).toLowerCase();
      return (
        instrument.includes(search) ||
        symbol.includes(search) ||
        company.includes(search)
      );
    },
  });

  if (!columns.length) {
    return (
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px 24px",
          color: "var(--text-tertiary)",
          fontSize: 13,
        }}
      >
        No columns selected. Use the column selector to choose visible columns.
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="market-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header, idx) => (
                <th
                  key={header.id}
                  className={idx === 0 ? "sticky-col" : ""}
                  style={{
                    minWidth: idx === 0 ? 120 : 90,
                    textAlign:
                      metaMap.get(header.id)?.type === "number" && idx !== 0
                        ? "right"
                        : "left",
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height: 200,
                  textAlign: "center",
                  color: "var(--text-tertiary)",
                  fontSize: 13,
                }}
              >
                No stocks match your search or filters.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell, idx) => (
                  <td
                    key={cell.id}
                    className={idx === 0 ? "sticky-col" : ""}
                    style={{
                      textAlign:
                        metaMap.get(cell.column.id)?.type === "number" &&
                        idx !== 0
                          ? "right"
                          : "left",
                    }}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
