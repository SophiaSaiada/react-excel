import "react";
import { FixedSizeGrid, FixedSizeList, GridOnScrollProps } from "react-window";
import Cell from "./Cell";
import SheetContext from "./SheetContext";
import { useCallback, useRef, useState } from "react";
import { useRem } from "./hooks/style";
import { getStickyCellComponent } from "./StickyCell";

const SHEET_HEIGHT = 100;
const SHEET_WIDTH = 100;

const Table = () => {
  const [sheetValues, setSheetValues] = useState(
    new Array(SHEET_HEIGHT)
      .fill(true)
      .map(() => new Array(SHEET_WIDTH).fill(true).map(() => "0"))
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

  const rem = useRem();

  const [hoveredCellIndexes, setHoveredCellIndexes] = useState<{
    row: number;
    column: number;
  } | null>(null);
  const stickyColumnListRef = useRef<FixedSizeList>(null);
  const stickyRowListRef = useRef<FixedSizeList>(null);
  const onScroll = useCallback(
    ({
      scrollTop,
      scrollLeft,
      scrollUpdateWasRequested,
    }: GridOnScrollProps) => {
      if (!scrollUpdateWasRequested) {
        stickyColumnListRef.current!.scrollTo(scrollTop);
        stickyRowListRef.current!.scrollTo(scrollLeft);
      }
    },
    []
  );

  return (
    <SheetContext.Provider
      value={{
        values: sheetValues,
        setCell,
        setHoveredCellIndexes,
      }}
    >
      <FixedSizeList
        ref={stickyRowListRef}
        itemData={{ hovered: hoveredCellIndexes?.column }}
        style={{ overflowX: "hidden" }}
        className="col-start-2"
        height={2.5 * rem + 1} // 1 pixel of border bottom
        width={window.screen.availWidth * 0.8 - 4 * rem - 4}
        layout="horizontal"
        itemCount={SHEET_WIDTH}
        itemSize={4 * rem}
      >
        {getStickyCellComponent("VERTICAL")}
      </FixedSizeList>

      <FixedSizeList
        ref={stickyColumnListRef}
        itemData={{ hovered: hoveredCellIndexes?.row }}
        style={{ overflowY: "hidden" }}
        height={window.screen.availHeight * 0.8}
        layout="vertical"
        itemCount={SHEET_HEIGHT}
        itemSize={2.5 * rem}
        width={4 * rem}
      >
        {getStickyCellComponent("HORIZONTAL")}
      </FixedSizeList>

      <FixedSizeGrid
        columnCount={SHEET_HEIGHT}
        onScroll={onScroll}
        // TODO: calculate width based on the content of the item.
        columnWidth={4 * rem}
        height={window.screen.availHeight * 0.8}
        width={window.screen.availWidth * 0.8 - 4 * rem}
        rowCount={SHEET_WIDTH}
        rowHeight={2.5 * rem}
      >
        {Cell}
      </FixedSizeGrid>
    </SheetContext.Provider>
  );
};

export default Table;
