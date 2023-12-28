import { create } from "zustand";
import { SHEET_HEIGHT, SHEET_WIDTH } from "./constants";

type Store = {
  cells: string[][];
  setCell: (rowIndex: number, columnIndex: number, value: string) => void;

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
};

export const useStore = create<Store>((set) => ({
  cells: new Array(SHEET_HEIGHT)
    .fill(true)
    .map(() => new Array(SHEET_WIDTH).fill(true).map(() => "0")),
  setCell(rowIndex, columnIndex, value) {
    set((state) => ({
      cells: state.cells.map((currentRow, mappedRowIndex) =>
        mappedRowIndex !== rowIndex
          ? currentRow
          : currentRow.map((currentValue, mappedColumnIndex) =>
              mappedColumnIndex !== columnIndex ? currentValue : value
            )
      ),
    }));
  },

  hoveredCell: null,
  setHoveredCell(value) {
    set({ hoveredCell: value });
  },
}));
