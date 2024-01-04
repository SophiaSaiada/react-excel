import { create } from "zustand";
import { Immutable } from "immer";
import { Cell } from "./core/types";
import { updateCellAndDependents } from "./core";

type Store = Immutable<{
  cells: ReadonlyMap<string, Cell>;
  setCell: (key: string, value: string) => void;

  hoveredCell: {
    row: number;
    column: number;
  } | null;
  setHoveredCell: (
    value: {
      row: number;
      column: number;
    } | null
  ) => void;
}>;

export const useStore = create<Store>((set) => ({
  cells: new Map(),
  setCell(key, value) {
    set((state) => ({
      cells: updateCellAndDependents(state.cells, key, value),
    }));
  },

  hoveredCell: null,
  setHoveredCell(value) {
    set({ hoveredCell: value });
  },
}));
