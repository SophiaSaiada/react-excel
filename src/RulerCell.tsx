import "react";
import clsx from "clsx";
import { numberToLetter } from "./utils";
import { ListChildComponentProps } from "react-window";
import Cell from "./Cell";
import { useStore } from "./store";

const RulerCell = ({
  index,
  style,
  data: { mode },
}: ListChildComponentProps<{
  mode: "VERTICAL" | "HORIZONTAL";
}>) => {
  const isHovered = useStore((state) =>
    mode === "HORIZONTAL"
      ? state.hoveredCell?.column === index
      : state.hoveredCell?.row === index
  );

  return (
    <div
      style={style}
      className={clsx(
        Cell.SHARED_STYLE.always,
        "leading-10 text-zinc-400",
        { "border-t": mode === "HORIZONTAL" || index === 0 },
        { "border-l": mode === "VERTICAL" || index === 0 },
        "border-r border-b border-zinc-800",
        { notHover: !isHovered },
        { "bg-zinc-800": isHovered }
      )}
    >
      {mode === "HORIZONTAL" ? numberToLetter(index) : (index + 1).toString()}
    </div>
  );
};

export default RulerCell;
