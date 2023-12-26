import { CSSProperties, useContext } from "react";
import SheetContext from "./SheetContext";

// Source: https://react-window.vercel.app/#/examples/grid/variable-size

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}

const Cell = ({ columnIndex, rowIndex, style }: CellProps) => {
  const { values, setCell } = useContext(SheetContext)!;
  return (
    <div style={style}>
      <input
        type="text"
        value={values[rowIndex][columnIndex]}
        onChange={(e) => setCell(rowIndex, columnIndex, e.target.value)}
      />
    </div>
  );
};

export default Cell;
