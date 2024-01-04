import FunctionName from "./FunctionName";
import {
  EvaluationResult,
  FunctionCellExpression,
  LiteralCellExpression,
} from "./types";

export const FUNCTIONS: {
  [K in Exclude<FunctionName, "REF">]: (evaluatedOperands: string[]) => string;
} = {
  SUM: (evaluatedOperands) =>
    evaluatedOperands
      .map(parseFloat)
      .reduce((a, b) => a + b, 0)
      .toString(),
  SUBTRACT: (evaluatedOperands) => {
    if (evaluatedOperands.length !== 2)
      throw new Error(`Expected 2 operands got ${evaluatedOperands.length}`);
    return (
      parseFloat(evaluatedOperands[0]) - parseFloat(evaluatedOperands[1])
    ).toString();
  },
  MAX: (evaluatedOperands) => {
    if (evaluatedOperands.length === 0) throw new Error("Got no operands");
    return Math.max(...evaluatedOperands.map(parseFloat)).toString();
  },
  MIN: (evaluatedOperands) => {
    if (evaluatedOperands.length === 0) throw new Error("Got no operands");
    return Math.min(...evaluatedOperands.map(parseFloat)).toString();
  },
};

export function handleRef(
  expression: FunctionCellExpression,
  directDependenciesEvaluationResult: ReadonlyMap<string, EvaluationResult>
) {
  if (expression.operands.length !== 1) {
    throw new Error("Ranges aren't supported");
  }

  const cellKey = (
    expression.operands[0] as LiteralCellExpression
  ).value.toUpperCase(); // type already checked in getReferencedCells
  const evaluationResult = directDependenciesEvaluationResult.get(cellKey);
  if (!evaluationResult) {
    throw new Error(
      `Evaluation result of cell ${cellKey} was not supplied to evaluator`
    );
  }
  return evaluationResult;
}
