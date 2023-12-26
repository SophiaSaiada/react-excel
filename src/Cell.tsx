import { useCallback, useContext } from "react";
import SheetContext from "./SheetContext";
import classNames from "classnames";
import { GridChildComponentProps } from "react-window";

export const CELL_SHARED_CLASSES =
  "px-2 text-sm w-16 h-10 focus:outline-none bg-zinc-900";

const Cell = ({ columnIndex, rowIndex, style }: GridChildComponentProps) => {
  const { values, setCell, setHoveredCellIndexes } = useContext(SheetContext)!;

  const onMouseEnter = useCallback(
    () => setHoveredCellIndexes({ column: columnIndex, row: rowIndex }),
    [columnIndex, rowIndex, setHoveredCellIndexes]
  );
  const onMouseLeave = useCallback(
    () => setHoveredCellIndexes(null),
    [setHoveredCellIndexes]
  );

  return (
    <div style={style}>
      <input
        className={classNames(
          CELL_SHARED_CLASSES,
          "caret-green-600",
          "border-b border-r border-zinc-800",
          "hover:border-b-green-800 hover:border-b-2 hover:bg-zinc-800",
          "focus:border-b-2 focus:border-b-green-600 focus:bg-zinc-700"
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        type="text"
        value={values[rowIndex][columnIndex]}
        onChange={(e) => setCell(rowIndex, columnIndex, e.target.value)}
      />
    </div>
  );
};

export default Cell;
