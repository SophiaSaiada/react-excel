import {
  type Cell,
  CellExpression,
  EvaluationResult,
  FunctionCellExpression,
  LiteralCellExpression,
} from "./types";
import { FUNCTIONS, handleRef } from "./functions";
import FunctionName from "./FunctionName";
import { ReferencedCells } from "./references";

export const EMPTY_SUCCESSFUL_EVALUATION_RESULT: EvaluationResult = {
  status: "SUCCESS",
  value: "",
};

export function evaluateCellExpression(
  expression: CellExpression,
  referencedCells: ReferencedCells,
  cells: ReadonlyMap<string, Cell>
): EvaluationResult {
  if (referencedCells.dynamicReferences) {
    return {
      status: "ERROR",
      message: "Dynamic cell references are not supported",
    };
  }

  const directDependenciesEvaluationResult = new Map<
    string,
    EvaluationResult
  >();
  for (const referencedCellKey of referencedCells.cells) {
    const referencedCell = cells.get(referencedCellKey.toUpperCase());
    if (!referencedCell) {
      directDependenciesEvaluationResult.set(
        referencedCellKey,
        EMPTY_SUCCESSFUL_EVALUATION_RESULT
      );
    } else {
      const { evaluationResult } = referencedCell;
      if (evaluationResult.status === "PENDING") {
        return { status: "ERROR", message: "Dependency cycle detected" };
      }
      directDependenciesEvaluationResult.set(
        referencedCellKey,
        evaluationResult
      );
    }
  }

  return innerEvaluateCellExpression(
    expression,
    directDependenciesEvaluationResult
  );
}

function innerEvaluateCellExpression(
  expression: CellExpression,
  directDependenciesEvaluationResult: ReadonlyMap<string, EvaluationResult>
): EvaluationResult {
  if (expression instanceof LiteralCellExpression) {
    return { status: "SUCCESS", value: expression.value };
  }

  if (!(expression instanceof FunctionCellExpression)) {
    throw new Error( // it's mainly for the type checker
      "Expected a FunctionCellExpression or a LiteralCellExpression"
    );
  }

  // TODO: caching
  const evaluatedOperands = expression.operands.map((operand) =>
    innerEvaluateCellExpression(operand, directDependenciesEvaluationResult)
  );
  const evaluatedOperandsErrors = evaluatedOperands.filter(
    (result) => result.status === "ERROR"
  );
  if (evaluatedOperandsErrors.length) {
    return evaluatedOperandsErrors[0];
  }
  const evaluatedOperandsValues = evaluatedOperands.map(
    // the cast is fine, as we checked before that there are no error result
    (result) => (result as { value: string }).value
  );

  // we cast to FunctionName here to satisfy the type checker,
  // but we actually check the received function name is legit when we attempt to find the handler
  const functionName = expression.functionName.toUpperCase() as FunctionName;

  try {
    if (functionName === "REF") {
      return handleRef(expression, directDependenciesEvaluationResult);
    } else {
      const handler = FUNCTIONS[functionName];
      if (handler === undefined) {
        return {
          status: "ERROR",
          message: `Unknown function ${expression.functionName}`,
        };
      }

      const result = handler(evaluatedOperandsValues);
      return { status: "SUCCESS", value: result };
    }
  } catch (error) {
    let message = "Unknown Error";
    if (error instanceof Error) message = error.message;
    return {
      status: "ERROR",
      message: `${expression.functionName}: ${message}`,
    };
  }
}
