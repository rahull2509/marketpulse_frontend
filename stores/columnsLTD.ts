/**
 * Column Store — Manages visible columns and column metadata.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ColumnMetadata } from "@/types/metadata";

interface ColumnState {
  metadata: ColumnMetadata[];
  groups: string[];
  visibleColumns: string[];
  columnOrder: string[];
  pinnedColumns: { left: string[]; right: string[] };
  pageSize: number;
  isLoaded: boolean;

  setMetadata: (metadata: ColumnMetadata[], groups: string[]) => void;
  toggleColumn: (column: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  setColumnOrder: (order: string[]) => void;
  setPinnedColumns: (pinned: { left: string[]; right: string[] }) => void;
  setPageSize: (size: number) => void;
  resetToDefaults: () => void;
  selectGroup: (group: string) => void;
  deselectGroup: (group: string) => void;
}

export const useColumnLTDStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      metadata: [],
      groups: [],
      visibleColumns: [],
      columnOrder: [],
      pinnedColumns: { left: ["Instrument", "trading_symbol"], right: [] },
      pageSize: 25,
      isLoaded: false,

      setMetadata: (metadata, groups) => {
        const { visibleColumns, columnOrder } = get();
        // On first load (or if no saved prefs), use defaults from backend
        const defaults = metadata
          .filter((m) => m.visible_default)
          .map((m) => m.column);

        set({
          metadata,
          groups,
          visibleColumns: visibleColumns.length > 0 ? visibleColumns : defaults,
          columnOrder: columnOrder.length > 0 ? columnOrder : defaults,
          isLoaded: true,
        });
      },

      toggleColumn: (column) => {
        const { visibleColumns, columnOrder } = get();
        if (visibleColumns.includes(column)) {
          set({
            visibleColumns: visibleColumns.filter((c) => c !== column),
            columnOrder: columnOrder.filter((c) => c !== column),
          });
        } else {
          set({
            visibleColumns: [...visibleColumns, column],
            columnOrder: [...columnOrder, column],
          });
        }
      },

      setVisibleColumns: (columns) => {
        const { columnOrder } = get();
        // Ensure columnOrder only contains visible columns, and append any new ones
        const newOrder = columnOrder.filter((c) => columns.includes(c));
        const added = columns.filter((c) => !newOrder.includes(c));
        set({ visibleColumns: columns, columnOrder: [...newOrder, ...added] });
      },

      setColumnOrder: (order) => set({ columnOrder: order }),
      setPinnedColumns: (pinned) => set({ pinnedColumns: pinned }),
      setPageSize: (size) => set({ pageSize: size }),

      resetToDefaults: () => {
        const { metadata } = get();
        const defaults = metadata
          .filter((m) => m.visible_default)
          .map((m) => m.column);
        set({
          visibleColumns: defaults,
          columnOrder: defaults,
          pinnedColumns: { left: ["Instrument", "trading_symbol"], right: [] },
        });
      },

      selectGroup: (group) => {
        const { metadata, visibleColumns, columnOrder } = get();
        const groupCols = metadata
          .filter((m) => m.group === group)
          .map((m) => m.column);
        const newVisible = [...new Set([...visibleColumns, ...groupCols])];
        const added = groupCols.filter((c) => !columnOrder.includes(c));
        set({
          visibleColumns: newVisible,
          columnOrder: [...columnOrder, ...added],
        });
      },

      deselectGroup: (group) => {
        const { metadata, visibleColumns, columnOrder } = get();
        const groupCols = new Set(
          metadata.filter((m) => m.group === group).map((m) => m.column)
        );
        set({
          visibleColumns: visibleColumns.filter((c) => !groupCols.has(c)),
          columnOrder: columnOrder.filter((c) => !groupCols.has(c)),
        });
      },
    }),
    {
      name: "marketpulse-columns-ltd",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          const state = persistedState as Partial<ColumnState>;
          const keyMap: Record<string, string> = {
            "open": "Open",
            "high": "High",
            "low": "Low",
            "close": "Close",
            "volume": "Volume"
          };
          
          const migrateList = (list: string[] | undefined) => 
            list?.map(col => keyMap[col] || col) || [];

          if (state.visibleColumns) state.visibleColumns = migrateList(state.visibleColumns);
          if (state.columnOrder) state.columnOrder = migrateList(state.columnOrder);
          if (state.pinnedColumns) {
            state.pinnedColumns.left = migrateList(state.pinnedColumns.left);
            state.pinnedColumns.right = migrateList(state.pinnedColumns.right);
          }
        }
        return persistedState;
      },
      partialize: (state) => ({
        visibleColumns: state.visibleColumns,
        columnOrder: state.columnOrder,
        pinnedColumns: state.pinnedColumns,
        pageSize: state.pageSize,
      }),
    }
  )
);
