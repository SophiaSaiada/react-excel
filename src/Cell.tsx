import { CSSProperties } from "react";

// Source: https://react-window.vercel.app/#/examples/grid/variable-size

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}

const Cell = ({ columnIndex, rowIndex, style }: CellProps) => (
  <div style={style}>
    Item {rowIndex},{columnIndex}
  </div>
);

export default Cell;
