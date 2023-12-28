import { useCallback } from "react";
import clsx from "clsx";
import { GridChildComponentProps } from "react-window";
import { useStore } from "./store";

function Cell({ columnIndex, rowIndex, style }: GridChildComponentProps) {
  const value = useStore((state) => state.cells[rowIndex][columnIndex]);
  const setCell = useStore((state) => state.setCell);

  const setHoveredCell = useStore((state) => state.setHoveredCell);
  const onMouseEnter = useCallback(
    () => setHoveredCell({ column: columnIndex, row: rowIndex }),
    [columnIndex, rowIndex, setHoveredCell]
  );
  const onMouseLeave = useCallback(
    () => setHoveredCell(null),
    [setHoveredCell]
  );

  return (
    <div style={style}>
      <input
        className={clsx(
          Cell.SHARED_STYLE.always,
          Cell.SHARED_STYLE.notHover,
          "caret-green-600",
          "border-b border-r border-zinc-800",
          "hover:border-b-green-800 hover:border-b-2 hover:bg-zinc-800",
          "focus:border-b-2 focus:border-b-green-600 focus:bg-zinc-700"
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        type="text"
        value={value}
        onChange={(e) => setCell(rowIndex, columnIndex, e.target.value)}
      />
    </div>
  );
}

Cell.SHARED_STYLE = {
  always: "px-2 text-sm w-16 max-w-16 h-10 max-h-10 focus:outline-none",
  notHover: "bg-zinc-900",
};

export default Cell;
