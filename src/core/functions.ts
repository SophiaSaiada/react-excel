import { formatNumber } from "../utils";
import FunctionName from "./FunctionName";
import { EvaluationResultValue } from "./types";

export const FUNCTIONS: {
  [K in FunctionName]: (
    evaluatedOperands: EvaluationResultValue[]
  ) => EvaluationResultValue;
} = {
  MAX: (evaluatedOperands) => {
    if (evaluatedOperands.length === 0) throw new Error("Got no operands");
    return applyNumericalFunction(Math.max, evaluatedOperands);
  },
  MIN: (evaluatedOperands) => {
    if (evaluatedOperands.length === 0) throw new Error("Got no operands");
    return applyNumericalFunction(Math.min, evaluatedOperands);
  },
  CONCATENATE: (evaluatedOperands) =>
    evaluatedOperands
      .map((o) => (typeof o === "number" ? formatNumber(o) : o))
      .join(""),
};

function applyNumericalFunction(
  operation: (...values: number[]) => number,
  evaluatedOperands: EvaluationResultValue[]
) {
  const numericOperands = evaluatedOperands
    .map((o) => (o === "" ? 0 : o))
    .filter((o) => typeof o === "number");
  if (numericOperands.length !== evaluatedOperands.length) {
    throw new Error("Got non-numeric operands");
  }
  return operation(...(numericOperands as number[]));
}
