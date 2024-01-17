import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import clsx from "clsx";
import { Immutable } from "immer";
import { GridChildComponentProps } from "react-window";
import { useStore } from "./store";
import { formatNumber, numberToLetter } from "./utils";
import type { Cell as CellType } from "./core/types";

function getEvaluationResultToDisplay(
  cell: Immutable<CellType> | undefined
): string {
  if (!cell) {
    return "";
  }
  const { evaluationResult } = cell;
  if (evaluationResult.status === "SUCCESS") {
    const { value } = evaluationResult;
    if (typeof value === "number") {
      return formatNumber(value);
    }
    return value;
  }
  if (evaluationResult.status === "ERROR") {
    return evaluationResult.message;
  }
  return "⏳"; // this should never be visible to the user, as we invalidate cells and re-evaluate them in the same state transaction
}

function Cell({ columnIndex, rowIndex, style }: GridChildComponentProps) {
  const cellKey = `${numberToLetter(columnIndex)}${rowIndex + 1}`;

  const value = useStore((state) => state.cells.get(cellKey));
  const setCell = useStore((state) => state.setCell);

  const [hasFocus, setHasFocus] = useState(false);
  const [intermediateValue, setIntermediateValue] = useState(value?.raw ?? "");

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
  useEffect(() => value && setIntermediateValue(value.raw), [value]);
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
    setCell(cellKey, intermediateValue);
  }, [cellKey, intermediateValue, setCell]);

  const onKeyUp = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const evaluationResultToDisplay = getEvaluationResultToDisplay(value);

  return (
    <div style={style} title={evaluationResultToDisplay}>
      <input
        className={clsx(
          Cell.SHARED_STYLE.always,
          Cell.SHARED_STYLE.notHover,
          "border-b border-r border-zinc-800",
          "hover:border-b-2 hover:bg-zinc-800",
          (!value || value.evaluationResult.status === "SUCCESS") &&
            "caret-green-600 hover:border-b-green-800 focus:border-b-green-600",
          value?.evaluationResult.status === "ERROR" &&
            "text-red-500 focus:text-white caret-red-600 hover:border-b-red-800 focus:border-b-red-600",
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
