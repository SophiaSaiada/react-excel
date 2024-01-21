import "react";
import {
  FixedSizeGrid,
  VariableSizeList,
  GridOnScrollProps,
} from "react-window";
import Cell from "./Cell";
import { useCallback, useEffect, useRef } from "react";
import { useRem } from "./hooks/style";
import RulerCell from "./RulerCell";
import { SHEET_HEIGHT, SHEET_WIDTH } from "./constants";
import { useStore } from "./store";
import baseSheet from "./baseSheet.json";
import FormulaEditor from "./FormulaEditor";
import useScreenSize from "./hooks/useScreenSize";

const storeInitialized = false;
const Table = () => {
  const setCell = useStore((state) => state.setCell);
  useEffect(() => {
    if (!storeInitialized) {
      Object.entries(baseSheet).forEach(([key, value]) => setCell(key, value));
    }
  }, [setCell]);

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

  const { width: windowWidth, height: windowHeight } = useScreenSize();

  return (
    <>
      <div className="bg-zinc-900 border-b border-r border-zinc-800"></div>

      <VariableSizeList
        ref={stickyRowListRef}
        itemData={{ mode: "HORIZONTAL" }}
        style={{ overflow: "hidden" }}
        height={2.5 * rem}
        width={windowWidth - 4 * rem}
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
        height={windowHeight - 2.5 * rem}
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
        columnWidth={4 * rem}
        height={windowHeight - 2.5 * rem}
        width={windowWidth - 4 * rem}
        rowCount={SHEET_WIDTH}
        rowHeight={2.5 * rem}
      >
        {Cell}
      </FixedSizeGrid>

      <FormulaEditor />
    </>
  );
};

export default Table;
