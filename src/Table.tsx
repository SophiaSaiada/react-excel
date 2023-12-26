import "react";
import { VariableSizeGrid as Grid } from "react-window";
import Cell from "./Cell";
import SheetContext from "./SheetContext";
import { useCallback, useState } from "react";

const SHEET_HEIGHT = 100;
const SHEET_WIDTH = 100;

const Table = () => {
  const [sheetValues, setSheetValues] = useState(
    new Array(SHEET_HEIGHT)
      .fill(true)
      .map((_, rowNumber) =>
        new Array(SHEET_WIDTH)
          .fill(true)
          .map((_, columnNumber) => `${columnNumber}:${rowNumber}`)
      )
  );

  const setCell = useCallback(
    (rowIndex: number, columnIndex: number, value: string) => {
      setSheetValues((currentSheetValues) =>
        currentSheetValues.map((currentRow, mappedRowIndex) =>
          mappedRowIndex !== rowIndex
            ? currentRow
            : currentRow.map((currentValue, mappedColumnIndex) =>
                mappedColumnIndex !== columnIndex ? currentValue : value
              )
        )
      );
    },
    []
  );

  return (
    <SheetContext.Provider
      value={{
        values: sheetValues,
        setCell,
      }}
    >
      <Grid
        columnCount={SHEET_HEIGHT}
        // TODO: calculate width based on the content of the item.
        columnWidth={() => 75}
        height={window.screen.availHeight * 0.8}
        rowCount={SHEET_WIDTH}
        rowHeight={() => 25}
        width={window.screen.availWidth * 0.8}
      >
        {Cell}
      </Grid>
    </SheetContext.Provider>
  );
};

export default Table;
