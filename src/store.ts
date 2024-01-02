import { create } from "zustand";
import { produce } from "immer";
import { SHEET_HEIGHT, SHEET_WIDTH } from "./constants";
import { parseCellRawValue } from "./core/parser";
import {
  LiteralCellExpression,
  type CellExpression,
  type EvaluationResult,
} from "./core/types";
import { evaluateCellExpression } from "./core/evaluator";

type Store = {
  cells: {
    raw: string;
    parsed: CellExpression;
    evaluationResult: EvaluationResult;
  }[][];
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
  cells: new Array(SHEET_HEIGHT).fill(true).map(() =>
    new Array(SHEET_WIDTH).fill(true).map(() => ({
      raw: "0",
      parsed: new LiteralCellExpression("0"),
      evaluationResult: { status: "SUCCESS", value: "0" },
    }))
  ),
  setCell(rowIndex, columnIndex, value) {
    const cellExpression = parseCellRawValue(value);
    const evaluationResult = evaluateCellExpression(cellExpression);
    set(
      produce((draft: Store) => {
        draft.cells[rowIndex][columnIndex] = {
          raw: value,
          parsed: parseCellRawValue(value),
          evaluationResult,
        };
      })
    );
  },

  hoveredCell: null,
  setHoveredCell(value) {
    set({ hoveredCell: value });
  },
}));
