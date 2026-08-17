"use client";

import React, { useMemo, useState, forwardRef, useImperativeHandle, CSSProperties } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
  type Row,
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

/* ── Cell Renderer ────────────────────────────────────────────── */

let cellRendererCount = 0;

function renderCell(
  value: unknown,
  meta: ColumnMetadata | undefined
): React.ReactNode {
  cellRendererCount++;
  if (value === null || value === undefined)
    return <span style={{ color: "var(--text-muted)" }}>—</span>;

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

  if (column === "day_change" || column === "Net Change") {
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

  if (type === "number") {
    const num = Number(value);
    if (unit === "₹") {
      return (
        <span className="font-tabular font-medium">
          {formatCurrency(num)}
        </span>
      );
    }
    if (column === "volume" || column === "Volume") {
      return (
        <span className="font-tabular text-muted">
          {formatVolume(num)}
        </span>
      );
    }
    return <span className="font-tabular">{num}</span>;
  }

  if (column === "trading_symbol") {
    return (
      <span
        className="font-mono text-sm"
        style={{
          color: "var(--color-accent)",
          fontWeight: 500,
        }}
      >
        {String(value)}
      </span>
    );
  }

  if (column === "Instrument") {
    return (
      <Link
        href={`/stock/${encodeURIComponent(String(value))}`}
        style={{
          color: "var(--text-primary)",
          fontWeight: 600,
          textDecoration: "none",
        }}
        className="hover-underline"
      >
        {String(value)}
      </Link>
    );
  }

  return <span style={{ fontWeight: 400 }}>{String(value)}</span>;
}

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc")
    return <ArrowUp size={12} style={{ color: "var(--color-accent)" }} />;
  if (isSorted === "desc")
    return <ArrowDown size={12} style={{ color: "var(--color-accent)" }} />;
  return (
    <ArrowUpDown
      size={12}
      style={{ color: "var(--text-muted)", opacity: 0.5 }}
    />
  );
}

/* ── Memoized Table Row ───────────────────────────────────────── */
// Prevents unnecessary re-renders for WebSocket delta ticks (unchanged rows
// keep the same object reference in Zustand). Also re-renders when the column
// configuration changes (toggle, reorder, pin) because TanStack recreates the
// Row object and its visible cells array in those cases.
const MemoizedTableRow = React.memo(
  ({
    row,
    metaMap,
    columnOrder,
  }: {
    row: Row<StockRecord>;
    metaMap: Map<string, ColumnMetadata>;
    columnOrder: string[];
  }) => {
    return (
      <tr>
        {row.getVisibleCells().map((cell) => {
          const isPinned = cell.column.getIsPinned();
          const isLastLeftPinned = isPinned === "left" && cell.column.getIsLastColumn("left");

          return (
            <td
              key={cell.id}
              style={{
                textAlign:
                  metaMap.get(cell.column.id)?.type === "number" &&
                    cell.column.id !== "Instrument"
                    ? "right"
                    : "left",
                position: isPinned ? "sticky" : "relative",
                left: isPinned === "left" ? `${cell.column.getStart("left")}px` : undefined,
                zIndex: isPinned ? 5 : undefined,
                backgroundColor: isPinned ? "inherit" : undefined,
                boxShadow: isLastLeftPinned ? "4px 0 8px -4px rgba(0,0,0,0.1)" : undefined,
              }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
    );
  },
  (prev, next) => {
    if (prev.columnOrder !== next.columnOrder) return false;
    // Re-render if the underlying data changed (WebSocket delta)
    if (prev.row.original !== next.row.original) return false;
    // Re-render if visible columns changed (toggle, reorder, pin)
    const prevCells = prev.row.getVisibleCells();
    const nextCells = next.row.getVisibleCells();
    if (prevCells.length !== nextCells.length) return false;
    // Check column identity — if column IDs differ, columns were reordered
    for (let i = 0; i < prevCells.length; i++) {
      if (prevCells[i].column.id !== nextCells[i].column.id) return false;
    }
    return true;
  }
);

/* ── Draggable Header ─────────────────────────────────────────── */

function DraggableHeader({
  header,
  metaMap,
}: {
  header: any;
  metaMap: Map<string, ColumnMetadata>;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: header.column.id,
    });

  const isPinned = header.column.getIsPinned();
  const isLastLeftPinned = isPinned === "left" && header.column.getIsLastColumn("left");

  const style: CSSProperties = {
    minWidth: header.column.getSize(),
    textAlign:
      metaMap.get(header.id)?.type === "number" && header.id !== "Instrument"
        ? "right"
        : "left",
    position: isPinned ? "sticky" : "relative",
    left: isPinned === "left" ? `${header.column.getStart("left")}px` : undefined,
    zIndex: isDragging ? 20 : isPinned ? 15 : undefined,
    backgroundColor: isPinned ? "var(--bg-secondary)" : undefined,
    boxShadow: isLastLeftPinned
      ? "4px 0 8px -4px rgba(0,0,0,0.1)"
      : isDragging
        ? "0 4px 12px rgba(0,0,0,0.15)"
        : undefined,
    opacity: isDragging ? 0.8 : 1,
    transform: CSS.Translate.toString(transform),
    transition,
    cursor: "grab",
  };

  return (
    <th ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header, header.getContext())}
    </th>
  );
}

/* ── Main Table ───────────────────────────────────────────────── */

interface DynamicTableProps {
  data: StockRecord[];
  globalFilter: string;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  columnsOverride?: string[];
  metadataOverride?: ColumnMetadata[];
  columnOrderOverride?: string[];
  pinnedColumnsOverride?: { left: string[]; right: string[] };
  onColumnOrderChange?: (order: string[]) => void;
  storeHook?: any; // avoid type issue if useColumnStore isn't perfectly matched
  sorting?: SortingState;
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>> | ((updater: import("@tanstack/react-table").Updater<SortingState>) => void);
  manualSorting?: boolean;
  isFetching?: boolean;
}

export interface DynamicTableRef {
  downloadCSV: (filename: string) => void;
}

export const DynamicTable = forwardRef<DynamicTableRef, DynamicTableProps>(
  ({ data, globalFilter, pagination, columnsOverride, metadataOverride, columnOrderOverride, pinnedColumnsOverride, onColumnOrderChange, storeHook, sorting: controlledSorting, onSortingChange: controlledOnSortingChange, manualSorting, isFetching }, ref) => {
    const useStore = storeHook || useColumnStore;
    const store = useStore();

    const metadata: ColumnMetadata[] = metadataOverride || store.metadata;
    const visibleColumns: string[] = columnsOverride || store.visibleColumns;
    const columnOrder: string[] = columnOrderOverride || store.columnOrder;
    const pinnedColumns: { left: string[]; right: string[] } = pinnedColumnsOverride || store.pinnedColumns;
    const setColumnOrder: (order: string[]) => void = onColumnOrderChange || store.setColumnOrder;
    const [internalSorting, setInternalSorting] = useState<SortingState>([]);
    const sorting = controlledSorting !== undefined ? controlledSorting : internalSorting;
    const setSorting = controlledOnSortingChange !== undefined ? controlledOnSortingChange : setInternalSorting;

    const metaMap = useMemo(() => {
      const map = new Map<string, ColumnMetadata>();
      metadata.forEach((m) => map.set(m.column, m));
      return map;
    }, [metadata]);

    console.log("DEBUG [Table]: Rows received from API:", data.length);
    console.log("DEBUG [Table]: Visible columns:", visibleColumns);

    const columns = useMemo<ColumnDef<StockRecord>[]>(() => {
      return visibleColumns
        .map((colName) => {
          const meta = metaMap.get(colName);
          const displayName = meta?.display_name || colName;
          const type = meta?.type || "string";

          const col: ColumnDef<StockRecord> = {
            id: colName,
            accessorFn: (row) => row[colName],
            size:
              colName === "Instrument"
                ? 200
                : colName === "trading_symbol"
                  ? 120
                  : 100,
            header: ({ column: tableCol }) => {
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      background: "none",
                      border: "none",
                      cursor: "inherit",
                      font: "inherit",
                      color: "inherit",
                      padding: 0,
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      tableCol.toggleSorting();
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Let dnd-kit handle drag
                  >
                    {displayName}
                    <SortIcon isSorted={tableCol.getIsSorted()} />
                    {isFetching && tableCol.getIsSorted() && (
                      <span className="spinner" style={{ width: 10, height: 10, borderWidth: 2, marginLeft: 2, borderColor: 'var(--text-tertiary)', borderTopColor: 'var(--color-accent)' }} />
                    )}
                  </button>
                </div>
              );
            },
            cell: ({ getValue }) => renderCell(getValue(), meta),
            sortingFn: type === "number" ? "basic" : "alphanumeric",
            enableSorting: meta?.sortable !== false,
          };

          return col;
        })
        .filter(Boolean);
    }, [visibleColumns, metaMap]);

    console.log("DEBUG [Table]: Column IDs:", columns.map(c => c.id));
    console.log("DEBUG [Table]: Accessor keys (IDs):", columns.map(c => c.id));

    const table = useReactTable({
      data,
      columns,
      state: {
        sorting,
        globalFilter,
        columnOrder,
        columnPinning: pinnedColumns,
        ...(pagination ? { pagination } : {}),
      },
      onSortingChange: setSorting,
      onColumnOrderChange: (updater) => {
        if (typeof updater === "function") {
          setColumnOrder(updater(columnOrder));
        } else {
          setColumnOrder(updater);
        }
      },
      manualSorting: manualSorting,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
      globalFilterFn: (row, _columnId, filterValue) => {
        const search = String(filterValue).toLowerCase();
        const instrument = String(row.original.Instrument || "").toLowerCase();
        const symbol = String(row.original.trading_symbol || "").toLowerCase();
        const company = String(row.original.company_name || "").toLowerCase();
        return (
          instrument.includes(search) ||
          symbol.includes(search) ||
          company.includes(search)
        );
      },
    });

    console.log("DEBUG [Table]: Row model length:", table.getRowModel().rows.length);
    let renderedRowCount = 0;

    useImperativeHandle(ref, () => ({
      downloadCSV: (filename: string) => {
        const rows = table.getRowModel().rows;
        const cols = table.getVisibleLeafColumns();

        const headers = cols.map((c) => {
          const meta = metaMap.get(c.id);
          return meta?.display_name || c.id;
        });

        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            cols
              .map((c) => {
                let val = row.getValue(c.id);
                if (val === null || val === undefined) return "";
                val = String(val).replace(/"/g, '""');
                return `"${val}"`;
              })
              .join(",")
          ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
      },
    }));

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
      useSensor(KeyboardSensor)
    );

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        const isDraggedPinned = pinnedColumns.left.includes(active.id as string);
        const isTargetPinned = pinnedColumns.left.includes(over.id as string);
        if (isDraggedPinned !== isTargetPinned) return;

        const oldIndex = columnOrder.indexOf(active.id as string);
        const newIndex = columnOrder.indexOf(over.id as string);
        setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
      }
    };

    return (
      <div className="table-container">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <table className="market-table" style={{ width: table.getTotalSize() }}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => (
                      <DraggableHeader
                        key={header.id}
                        header={header}
                        metaMap={metaMap}
                      />
                    ))}
                  </SortableContext>
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    style={{ textAlign: "center", padding: "var(--sp-6)" }}
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  renderedRowCount++;
                  return (
                    <MemoizedTableRow
                      key={row.id}
                      row={row}
                      metaMap={metaMap}
                      columnOrder={columnOrder}
                    />
                  );
                })
              )}
            </tbody>
          </table>
        </DndContext>
      </div>
    );
  })
