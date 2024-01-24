import { useCallback, useRef } from "react";
import clsx from "clsx";
import { GridChildComponentProps } from "react-window";
import { useStore } from "./store";
import { numberToLetter } from "./utils";
import { getEvaluationResultToDisplay } from "./getEvaluationResultToDisplay";

function Cell({ columnIndex, rowIndex, style }: GridChildComponentProps) {
  const cellKey = `${numberToLetter(columnIndex)}${rowIndex + 1}`;

  const value = useStore((state) => state.cells.get(cellKey));

  const showFormulaEditor = useStore((state) => state.showFormulaEditor);
  const isActiveCell = useStore(
    (state) =>
      state.formulaEditorProps.show &&
      state.formulaEditorProps.cellKey === cellKey
  );

  const setHoveredCell = useStore((state) => state.setHoveredCell);
  const onMouseEnter = useCallback(
    () => setHoveredCell(cellKey),
    [cellKey, setHoveredCell]
  );
  const onMouseLeave = useCallback(
    () => setHoveredCell(null),
    [setHoveredCell]
  );

  const thisRef = useRef<HTMLDivElement | null>(null);

  const onClick = useCallback(() => {
    if (!thisRef.current) return;
    const { left, top } = thisRef.current.getBoundingClientRect();
    showFormulaEditor({ cellKey, left, top, show: true });
  }, [showFormulaEditor, cellKey]);

  const { valueToDisplay, isError } = getEvaluationResultToDisplay(value);

  return (
    <div className="group" style={style} onClick={onClick} ref={thisRef}>
      {valueToDisplay.length > 5 && (
        <div
          className={clsx(
            "absolute bottom-0 left-0 translate-y-full w-max max-w-32 z-50",
            "bg-zinc-800 border border-zinc-700 py-2 px-2",
            "text-xs text-left break-words",
            isError ? "text-red-500" : "text-white",
            "opacity-0 pointer-events-none transition-opacity duration-100",
            !isActiveCell && "group-hover:opacity-100"
          )}
        >
          {valueToDisplay}
        </div>
      )}
      <div
        className={clsx(
          Cell.SHARED_STYLE,
          "min-w-16 w-16 text-nowrap leading-10 text-left px-2 bg-zinc-900 border-b border-r border-zinc-800",
          "hover:border-b-2 hover:bg-zinc-800",
          isError && "text-red-500",
          isActiveCell && [
            "border-b-2 bg-zinc-700",
            isError ? "border-b-red-600" : "border-b-green-600",
          ]
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {valueToDisplay}
      </div>
    </div>
  );
}

Cell.SHARED_STYLE = "text-sm h-10 max-h-10 focus:outline-none";

export default Cell;
