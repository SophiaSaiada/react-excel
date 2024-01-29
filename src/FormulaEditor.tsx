import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useStore } from "./store";
import { useRem } from "./hooks/style";
import { getEvaluationResultToDisplay } from "./getEvaluationResultToDisplay";
import { CellReferenceLiteral, tokenize } from "./core/lexer";
import { tokenMatcher } from "chevrotain";
import { EQUAL_SIGN } from "./constants";
import { normalizeCellKey } from "./utils";

const useSyncHighlightedCellRange = (
  textArea: HTMLTextAreaElement | null,
  show: boolean
) => {
  const setHighlightedCellKey = useStore(
    (state) => state.setHighlightedCellKey
  );
  const syncHighlightedCellRange = useCallback(() => {
    if (!show || textArea === null) {
      setHighlightedCellKey(null);
      return;
    }
    if (!textArea.value.startsWith(EQUAL_SIGN)) {
      // cell isn't a formula
      setHighlightedCellKey(null);
      return;
    }
    const activeReferencedCellKey = tokenize(textArea.value).tokens.filter(
      (token) =>
        token.startOffset <= textArea.selectionStart &&
        (token.endOffset === undefined ||
          textArea.selectionEnd <= token.endOffset + 1) &&
        tokenMatcher(token, CellReferenceLiteral)
    )[0]?.image;
    setHighlightedCellKey(
      activeReferencedCellKey === undefined
        ? null
        : normalizeCellKey(activeReferencedCellKey)
    );
  }, [textArea, show, setHighlightedCellKey]);
  return syncHighlightedCellRange;
};

// Updates the height and width of a <textarea> when the value changes.
const useAutoSizeTextArea = (
  textAreaRef: HTMLTextAreaElement | null,
  value: string // we don't use this value, but we want to run the effect every time it's changed
) => {
  const [width, setWidth] = useState(0);
  const rem = useRem();
  useEffect(() => {
    if (textAreaRef) {
      // We need to reset the width momentarily to get the correct scrollWidth for the textarea
      textAreaRef.style.width = "0px";
      const newWidth = textAreaRef.scrollWidth + 1 * rem; // extra 1rem padding to the bottom
      textAreaRef.style.width = newWidth + "px";
      setWidth(newWidth);

      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      textAreaRef.style.height = "0px";
      textAreaRef.style.height = textAreaRef.scrollHeight + 0.5 * rem + "px"; // extra .5rem padding to the right
    }
  }, [textAreaRef, value, rem, setWidth]);
  return { width };
};

function FormulaEditor() {
  const { cellKey, top, left, show } = useStore(
    (state) => state.formulaEditorProps
  );
  const hideFormulaEditor = useStore((state) => state.hideFormulaEditor);

  const cell = useStore((state) => state.cells.get(cellKey));
  const setCell = useStore((state) => state.setCell);

  const [intermediateValue, setIntermediateValue] = useState(cell?.raw ?? "");

  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const textAreaWidth = useAutoSizeTextArea(
    textAreaRef.current,
    intermediateValue
  ).width;

  // keep the intermediate value in sync with store
  // we add cellKey to reset the value even when we're moving between cells that are identical with their content (zustand won't change cell in this case),
  // as the intermediateValue can differ from cell's current value
  useEffect(() => setIntermediateValue(cell?.raw ?? ""), [cell, cellKey]);

  const previousCellKey = useRef<string | null>(null);
  useEffect(() => {
    if (previousCellKey.current === cellKey) {
      return;
    }
    if (previousCellKey.current !== null) {
      // set cell in store on blur
      setCell(previousCellKey.current, intermediateValue);
    }
    previousCellKey.current = cellKey;
  }, [cellKey, setCell, intermediateValue]);

  // restore focus after changing cell or after re-clicking a cell after pressing Esc
  useEffect(() => {
    if (show) {
      textAreaRef.current?.focus();
    }
  }, [show, cellKey]);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) =>
      setIntermediateValue(e.target.value),
    [setIntermediateValue]
  );

  // we don't want to update the store in each key press, as it will cause unnecessary failed parsing attempts,
  // so we update it only when the user focuses another cell, or hit Escape or Cmd+Enter, even if it's outside the formula editor
  useEffect(() => {
    const listener = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
        textAreaRef.current?.blur();
        setCell(cellKey, intermediateValue);
        hideFormulaEditor();
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [setCell, cellKey, intermediateValue, hideFormulaEditor]);

  const syncHighlightedCellRange = useSyncHighlightedCellRange(
    textAreaRef.current,
    show
  );
  useEffect(
    () => syncHighlightedCellRange(),
    [
      syncHighlightedCellRange,
      // it's here to support cases in which the new cell's formula ends with cell reference
      intermediateValue,
    ]
  );

  const { valueToDisplay, isError } = getEvaluationResultToDisplay(cell);

  return (
    <div
      className={clsx(
        "z-40 fixed top-0 left-0",
        "flex flex-col items-stretch leading-6",
        "transition ease-out delay-0 duration-100 box-border",
        !show ? "opacity-0 pointer-events-none" : "opacity-100"
      )}
      style={{ transform: `translate(${left}px, ${top}px)` }} // TODO: handle rows at the bottom
    >
      <div
        className={clsx(
          "bg-zinc-800 border border-b-2 border-zinc-700 shadow-md",
          isError ? "border-b-red-600" : "border-b-green-600"
        )}
      >
        <textarea
          className={clsx(
            "text-sm",
            "min-h-[calc(2rem-3px)]", // cell height - 1px top border - 2px bottom border
            "pt-2 pl-2 min-w-[calc(3rem-2px)]", // 4rem cell width - 2px border - .5rem tailwind's padding - .5rem useAutoSizeTextArea's padding
            isError ? "caret-red-600" : "caret-green-600",
            "text-nowrap overflow-hidden resize-none font-mono",
            "bg-transparent outline-none",
            "align-bottom" // prevent weird bottom margin
          )}
          spellCheck={false}
          value={intermediateValue}
          onChange={onChange}
          onKeyUp={syncHighlightedCellRange}
          onClick={syncHighlightedCellRange}
          ref={textAreaRef}
        />
      </div>

      {valueToDisplay && cell?.formula && (
        <div
          className={clsx(
            "bg-zinc-800 shadow-md text-xs text-left break-words",
            "px-2 py-2 border border-t-0 border-zinc-700 transition",
            cell.raw === intermediateValue
              ? "opacity-100 scale-100 duration-75"
              : "opacity-0 scale-90",
            isError ? "text-red-500" : "text-white"
          )}
          style={{
            // content should affect the overall width up to a width of 2 cells (cause error messages can be pretty long),
            // after this limit - the content will take the width of the textArea (and at least 2 cells), which isn't bound to any limit.
            // width = max(min(textAreaWidth, 2 * cellWidth = 8rem), min(content, 2 * cellWidth = 8rem))
            maxWidth: `max(${textAreaWidth + 2}px, 8rem)`, // textAreaWidth doesn't include borders, so we add 2px for each border in the sides
            // We also want the content to fill the container, so if the textArea is wider than the content - we use the bigger one
            minWidth: `max(${textAreaWidth + 2}px, min(100%,8rem))`,
            // TBH I have no idea why I had to use both minWidth and maxWidth, but it doesn't work without it
          }}
        >
          <strong>{cellKey}: </strong>
          {valueToDisplay}
        </div>
      )}
    </div>
  );
}

export default FormulaEditor;
