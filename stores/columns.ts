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
  isLoaded: boolean;

  setMetadata: (metadata: ColumnMetadata[], groups: string[]) => void;
  toggleColumn: (column: string) => void;
  setVisibleColumns: (columns: string[]) => void;
  resetToDefaults: () => void;
  selectGroup: (group: string) => void;
  deselectGroup: (group: string) => void;
}

export const useColumnStore = create<ColumnState>()(
  persist(
    (set, get) => ({
      metadata: [],
      groups: [],
      visibleColumns: [],
      isLoaded: false,

      setMetadata: (metadata, groups) => {
        const { visibleColumns } = get();
        // On first load (or if no saved prefs), use defaults from backend
        const defaults = metadata
          .filter((m) => m.visible_default)
          .map((m) => m.column);

        set({
          metadata,
          groups,
          visibleColumns: visibleColumns.length > 0 ? visibleColumns : defaults,
          isLoaded: true,
        });
      },

      toggleColumn: (column) => {
        const { visibleColumns } = get();
        if (visibleColumns.includes(column)) {
          set({ visibleColumns: visibleColumns.filter((c) => c !== column) });
        } else {
          set({ visibleColumns: [...visibleColumns, column] });
        }
      },

      setVisibleColumns: (columns) => set({ visibleColumns: columns }),

      resetToDefaults: () => {
        const { metadata } = get();
        const defaults = metadata
          .filter((m) => m.visible_default)
          .map((m) => m.column);
        set({ visibleColumns: defaults });
      },

      selectGroup: (group) => {
        const { metadata, visibleColumns } = get();
        const groupCols = metadata
          .filter((m) => m.group === group)
          .map((m) => m.column);
        const newVisible = [...new Set([...visibleColumns, ...groupCols])];
        set({ visibleColumns: newVisible });
      },

      deselectGroup: (group) => {
        const { metadata, visibleColumns } = get();
        const groupCols = new Set(
          metadata.filter((m) => m.group === group).map((m) => m.column)
        );
        set({ visibleColumns: visibleColumns.filter((c) => !groupCols.has(c)) });
      },
    }),
    {
      name: "marketpulse-columns",
      partialize: (state) => ({ visibleColumns: state.visibleColumns }),
    }
  )
);
