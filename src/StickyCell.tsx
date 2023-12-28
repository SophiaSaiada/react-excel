import "react";
import clsx from "clsx";
import { numberToLetter } from "./utils";
import { ListChildComponentProps } from "react-window";
import Cell from "./Cell";

export const getStickyCellComponent =
  (mode: "VERTICAL" | "HORIZONTAL") =>
  ({ index, style, data }: ListChildComponentProps) => {
    return (
      <div
        style={style}
        className={clsx(
          Cell.SHARED_STYLE.always,
          "leading-10 text-zinc-400",
          { "border-t": mode === "HORIZONTAL" || index === 0 },
          { "border-l": mode === "VERTICAL" || index === 0 },
          "border-r border-b border-zinc-800",
          { notHover: data.hovered !== index },
          { "bg-zinc-800": data.hovered === index }
        )}
      >
        {mode === "HORIZONTAL" ? numberToLetter(index) : (index + 1).toString()}
      </div>
    );
  };
