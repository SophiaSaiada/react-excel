import { createContext } from "react";

const SheetContext = createContext<{
  values: string[][];
  setCell: (rowIndex: number, columnIndex: number, value: string) => void;
} | null>(null);

export default SheetContext;
