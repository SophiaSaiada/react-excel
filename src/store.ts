import { create } from "zustand";
import { SHEET_HEIGHT, SHEET_WIDTH } from "./constants";
import { parseCellRawValue } from "./core/parser";
import { LiteralCellExpression, type CellExpression } from "./core/types";

type Store = {
  cells: { raw: string; parsed: CellExpression }[][];
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
    .map(() =>
      new Array(SHEET_WIDTH)
        .fill(true)
        .map(() => ({ raw: "0", parsed: new LiteralCellExpression("0") }))
    ),
  setCell(rowIndex, columnIndex, value) {
    set((state) => ({
      cells: state.cells.map((currentRow, mappedRowIndex) =>
        mappedRowIndex !== rowIndex
          ? currentRow
          : currentRow.map((currentValue, mappedColumnIndex) =>
              mappedColumnIndex !== columnIndex
                ? currentValue
                : { raw: value, parsed: parseCellRawValue(value) }
            )
      ),
    }));
  },

  hoveredCell: null,
  setHoveredCell(value) {
    set({ hoveredCell: value });
  },
}));
