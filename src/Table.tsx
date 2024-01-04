import "react";
import {
  FixedSizeGrid,
  VariableSizeList,
  GridOnScrollProps,
} from "react-window";
import Cell from "./Cell";
import { useCallback, useRef } from "react";
import { useRem } from "./hooks/style";
import RulerCell from "./RulerCell";
import { SHEET_HEIGHT, SHEET_WIDTH } from "./constants";

const Table = () => {
  const rem = useRem();

  const stickyColumnListRef = useRef<VariableSizeList>(null);
  const stickyRowListRef = useRef<VariableSizeList>(null);
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
    <>
      <VariableSizeList
        ref={stickyRowListRef}
        itemData={{ mode: "HORIZONTAL" }}
        style={{ overflow: "hidden" }}
        className="col-start-2"
        height={2.5 * rem}
        width={window.screen.availWidth * 0.8 - 4 * rem}
        layout="horizontal"
        itemCount={SHEET_WIDTH}
        itemSize={(index) => (index === SHEET_WIDTH - 1 ? 8 * rem : 4 * rem)}
      >
        {RulerCell}
      </VariableSizeList>

      <VariableSizeList
        ref={stickyColumnListRef}
        itemData={{ mode: "VERTICAL" }}
        style={{ overflowY: "hidden" }}
        height={window.screen.availHeight * 0.8}
        layout="vertical"
        itemCount={SHEET_HEIGHT}
        itemSize={(index) =>
          index === SHEET_HEIGHT - 1 ? 6.4 * rem : 2.5 * rem
        }
        width={4 * rem}
      >
        {RulerCell}
      </VariableSizeList>

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
    </>
  );
};

export default Table;
