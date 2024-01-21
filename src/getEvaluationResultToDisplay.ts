import { Immutable } from "immer";
import { Cell } from "./core/types";
import { formatNumber } from "./utils";

export function getEvaluationResultToDisplay(
  cell: Immutable<Cell> | undefined
): { valueToDisplay: string; isError: boolean } {
  if (!cell) {
    return { valueToDisplay: "", isError: false };
  }
  const { evaluationResult } = cell;
  if (evaluationResult.status === "SUCCESS") {
    const { value } = evaluationResult;
    if (typeof value === "number") {
      return { valueToDisplay: formatNumber(value), isError: false };
    }
    return { valueToDisplay: value, isError: false };
  }
  if (evaluationResult.status === "ERROR") {
    return { valueToDisplay: evaluationResult.message, isError: true };
  }
  return { valueToDisplay: "⏳", isError: true }; // this should never be visible to the user, as we invalidate cells and re-evaluate them in the same state transaction
}
