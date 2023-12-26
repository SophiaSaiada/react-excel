import { createContext } from "react";

const SheetContext = createContext<{
  values: string[][];
  setCell: (rowIndex: number, columnIndex: number, value: string) => void;
  setHoveredCellIndexes: (
    value: {
      row: number;
      column: number;
    } | null
  ) => void;
} | null>(null);

export default SheetContext;
