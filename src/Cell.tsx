import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import clsx from "clsx";
import { GridChildComponentProps } from "react-window";
import { useStore } from "./store";

function Cell({ columnIndex, rowIndex, style }: GridChildComponentProps) {
  const value = useStore((state) => state.cells[rowIndex][columnIndex]);
  const setCell = useStore((state) => state.setCell);

  const [intermediateValue, setIntermediateValue] = useState(value.raw);

  const setHoveredCell = useStore((state) => state.setHoveredCell);
  const onMouseEnter = useCallback(
    () => setHoveredCell({ column: columnIndex, row: rowIndex }),
    [columnIndex, rowIndex, setHoveredCell]
  );
  const onMouseLeave = useCallback(
    () => setHoveredCell(null),
    [setHoveredCell]
  );

  // keep the intermediate value in sync with store
  useEffect(() => setIntermediateValue(value.raw), [value.raw]);
  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setIntermediateValue(e.target.value);
    },
    [setIntermediateValue]
  );

  // we don't want to update the store in each key press, as it will cause unnecessary failed parsing attempts,
  // so we update it only when the user finishes to type in the cell
  const updateStore = useCallback(
    () => setCell(rowIndex, columnIndex, intermediateValue),
    [rowIndex, columnIndex, intermediateValue, setCell]
  );

  const onKeyUp = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        updateStore();
      }
    },
    [updateStore]
  );

  return (
    // TODO: evaluate parsed cell, then display the result if the cell isn't focused, and remove the title
    <div style={style} title={JSON.stringify(value.parsed)}>
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
        value={intermediateValue}
        onBlur={updateStore}
        onKeyUp={onKeyUp}
        onChange={onChange}
      />
    </div>
  );
}

Cell.SHARED_STYLE = {
  always: "px-2 text-sm w-16 max-w-16 h-10 max-h-10 focus:outline-none",
  notHover: "bg-zinc-900",
};

export default Cell;
