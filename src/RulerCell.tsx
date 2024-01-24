import "react";
import clsx from "clsx";
import { cellKeyToIndexes, numberToLetter } from "./utils";
import { ListChildComponentProps } from "react-window";
import Cell from "./Cell";
import { useStore } from "./store";

function isCellKeyMatchesRulerCellIndex(
  mode: "VERTICAL" | "HORIZONTAL",
  cellKey: string | null,
  index: number
) {
  if (cellKey === null) {
    return false;
  }
  const { column, row } = cellKeyToIndexes(cellKey);
  return mode === "HORIZONTAL" ? column === index : row === index;
}

const RulerCell = ({
  index,
  style,
  data: { mode },
}: ListChildComponentProps<{
  mode: "VERTICAL" | "HORIZONTAL";
}>) => {
  const isHovered = useStore((state) =>
    isCellKeyMatchesRulerCellIndex(mode, state.hoveredCell, index)
  );
  const isActive = useStore(
    (state) =>
      state.formulaEditorProps.show &&
      isCellKeyMatchesRulerCellIndex(
        mode,
        state.formulaEditorProps.cellKey,
        index
      )
  );

  return (
    <div
      style={style}
      className={clsx(
        Cell.SHARED_STYLE,
        "w-16 max-w-16 px-2 leading-10 text-zinc-400 transition-colors duration-0 text-center",
        "border-r border-b border-zinc-800",
        { "bg-zinc-800": isHovered || isActive },
        { "border-b-2 border-b-green-600": isActive }
      )}
    >
      {mode === "HORIZONTAL" ? numberToLetter(index) : (index + 1).toString()}
    </div>
  );
};

export default RulerCell;
