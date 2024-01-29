import { create } from "zustand";
import { Immutable } from "immer";
import { Cell } from "./core/types";
import { updateCellAndDependents } from "./core";

type FormulaEditorProps = {
  cellKey: string;
  top: number;
  left: number;
  show: boolean;
  highlightedCellKey: string | null;
};

type Store = Immutable<{
  cells: ReadonlyMap<string, Cell>;
  setCell: (key: string, value: string) => void;

  hoveredCell: string | null;
  setHoveredCell: (value: string | null) => void;

  formulaEditorProps: FormulaEditorProps;
  showFormulaEditor: (
    props: Omit<FormulaEditorProps, "highlightedCellKey">
  ) => void;
  hideFormulaEditor: () => void;
  setHighlightedCellKey: (value: string | null) => void;
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

  formulaEditorProps: {
    top: 0,
    left: 0,
    cellKey: "A1",
    // all default values until now are irrelevant as the editor is hidden by default
    show: false,
    highlightedCellKey: null,
  },
  showFormulaEditor(props) {
    set({
      formulaEditorProps: { ...props, show: true, highlightedCellKey: null },
    });
  },
  hideFormulaEditor() {
    set((state) => ({
      formulaEditorProps: {
        ...state.formulaEditorProps,
        show: false,
        highlightedCellKey: null,
      },
    }));
  },
  setHighlightedCellKey(value) {
    set((state) => ({
      formulaEditorProps: {
        ...state.formulaEditorProps,
        highlightedCellKey: value,
      },
    }));
  },
}));
