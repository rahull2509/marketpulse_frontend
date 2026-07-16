"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
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
import { useMarketStore } from "@/stores/market";
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

// ── Cell Renderer ──────────────────────────────────────────────────────

function renderCell(value: unknown, meta: ColumnMetadata | undefined): React.ReactNode {
  if (value === null || value === undefined) return <span style={{ color: "var(--text-muted)" }}>—</span>;

  const unit = meta?.unit || "";
  const type = meta?.type || "string";
  const column = meta?.column || "";

  // Special columns
  if (column === "day_change_pct" || unit === "%") {
    const num = Number(value);
    return (
      <span className={`font-tabular font-medium ${getChangeClass(num)}`}>
        {formatPercent(num)}
      </span>
    );
  }

  if (column === "Net Change") {
    const num = Number(value);
    return (
      <span className={`font-tabular font-medium ${getChangeClass(num)}`}>
        {formatChange(num)}
      </span>
    );
  }

  if (unit === "₹" && type === "number") {
    return <span className="font-tabular">{formatCurrency(value)}</span>;
  }

  if (column === "Volume" || column === "Total Buy Quantity" || column === "Total Sell Quantity") {
    return <span className="font-tabular">{formatVolume(value)}</span>;
  }

  if (column === "trading_symbol") {
    return (
      <Link
        href={`/stock/${encodeURIComponent(String(value))}`}
        className="font-semibold transition-colors hover:underline"
        style={{ color: "var(--color-accent)" }}
      >
        {String(value)}
      </Link>
    );
  }

  if (type === "number") {
    const num = Number(value);
    if (!isNaN(num)) return <span className="font-tabular">{num.toFixed(2)}</span>;
  }

  return <span>{String(value)}</span>;
}

// ── Sort Header ────────────────────────────────────────────────────────

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ArrowUp className="h-3 w-3" />;
  if (isSorted === "desc") return <ArrowDown className="h-3 w-3" />;
  return <ArrowUpDown className="h-3 w-3 opacity-30" />;
}

// ── Main Component ─────────────────────────────────────────────────────

interface DynamicTableProps {
  data: StockRecord[];
  globalFilter: string;
}

export function DynamicTable({ data, globalFilter }: DynamicTableProps) {
  const { metadata } = useColumnStore();
  const { visibleColumns } = useColumnStore();
  const [sorting, setSorting] = useState<SortingState>([]);

  // Build a metadata lookup
  const metaMap = useMemo(() => {
    const map = new Map<string, ColumnMetadata>();
    metadata.forEach((m) => map.set(m.column, m));
    return map;
  }, [metadata]);

  // Generate columns from metadata + visible list
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
              className="flex items-center gap-1"
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
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const instrument = String(row.original.Instrument || "").toLowerCase();
      const symbol = String(row.original.trading_symbol || "").toLowerCase();
      const company = String(row.original.company_name || "").toLowerCase();
      return instrument.includes(search) || symbol.includes(search) || company.includes(search);
    },
  });

  if (!columns.length) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border py-20"
        style={{
          borderColor: "var(--border-primary)",
          color: "var(--text-tertiary)",
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
                  style={{ minWidth: idx === 0 ? "120px" : "90px" }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                className="py-16 text-center"
                style={{ color: "var(--text-tertiary)" }}
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
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
