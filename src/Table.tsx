import "react";
import { VariableSizeGrid as Grid } from "react-window";
import Cell from "./Cell";

// Source: https://react-window.vercel.app/#/examples/grid/variable-size

// These item sizes are arbitrary.
// Yours should be based on the content of the item.
const columnWidths = new Array(1000)
  .fill(true)
  .map(() => 75 + Math.round(Math.random() * 50));
const rowHeights = new Array(1000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 50));

const Table = () => (
  <Grid
    columnCount={1000}
    columnWidth={(index) => columnWidths[index]}
    height={window.screen.availHeight * 0.8}
    rowCount={1000}
    rowHeight={(index) => rowHeights[index]}
    width={window.screen.availWidth * 0.8}
  >
    {Cell}
  </Grid>
);

export default Table;
