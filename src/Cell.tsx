import { CSSProperties, useContext } from "react";
import SheetContext from "./SheetContext";
import classNames from "classnames";

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
        className={classNames(
          "px-2 text-sm w-16 h-10 focus:outline-none bg-zinc-900 caret-green-600",
          { "border-t": rowIndex === 0 },
          { "border-l": columnIndex === 0 },
          "border-b border-r border-zinc-800",
          "hover:border-b-green-800 hover:border-b-2 hover:bg-zinc-800",
          "focus:border-b-2 focus:border-b-green-600 focus:bg-zinc-700"
        )}
        type="text"
        value={values[rowIndex][columnIndex]}
        onChange={(e) => setCell(rowIndex, columnIndex, e.target.value)}
      />
    </div>
  );
};

export default Cell;
