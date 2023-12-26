import "react";
import classNames from "classnames";
import { numberToLetter } from "./utils";
import { ListChildComponentProps } from "react-window";
import { CELL_SHARED_CLASSES } from "./Cell";

export const getStickyCellComponent =
  (mode: "VERTICAL" | "HORIZONTAL") =>
  ({ index, style }: ListChildComponentProps) => {
    return (
      <div
        style={style}
        className={classNames(
          CELL_SHARED_CLASSES,
          "leading-10 text-zinc-400",
          { "border-t": mode === "VERTICAL" || index === 0 },
          { "border-l": mode === "HORIZONTAL" || index === 0 },
          "border-r border-b border-zinc-800"
        )}
      >
        {mode === "VERTICAL" ? numberToLetter(index) : (index + 1).toString()}
      </div>
    );
  };
