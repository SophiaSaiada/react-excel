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

  const [hasFocus, setHasFocus] = useState(false);
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

  const onFocus = useCallback(() => {
    setHasFocus(true);
  }, [setHasFocus]);
  // we don't want to update the store in each key press, as it will cause unnecessary failed parsing attempts,
  // so we update it only when the user finishes to type in the cell
  const onBlur = useCallback(() => {
    setHasFocus(false);
    setCell(rowIndex, columnIndex, intermediateValue);
  }, [rowIndex, columnIndex, intermediateValue, setCell]);

  const onKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const evaluationResultToDisplay =
    value.evaluationResult.status === "SUCCESS"
      ? value.evaluationResult.value
      : value.evaluationResult.message;

  return (
    <div style={style} title={evaluationResultToDisplay}>
      <input
        className={clsx(
          Cell.SHARED_STYLE.always,
          Cell.SHARED_STYLE.notHover,
          "border-b border-r border-zinc-800",
          "hover:border-b-2 hover:bg-zinc-800",
          value.evaluationResult.status === "SUCCESS"
            ? "caret-green-600 hover:border-b-green-800 focus:border-b-green-600"
            : "text-red-500 focus:text-white caret-red-600 hover:border-b-red-800 focus:border-b-red-600",
          "focus:border-b-2 focus:bg-zinc-700"
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        type="text"
        value={hasFocus ? intermediateValue : evaluationResultToDisplay}
        onFocus={onFocus}
        onBlur={onBlur}
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
