import {
  CellExpression,
  EvaluationResult,
  FunctionCellExpression,
  LiteralCellExpression,
} from "./types";
import { FUNCTIONS } from "./functions";
import FunctionName from "./FunctionName";

export function evaluateCellExpression(
  expression: CellExpression
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
  const evaluatedOperands = expression.operands.map(evaluateCellExpression);
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

  const handler =
    // we cast to FunctionName here to satisfy the type checker,
    // but in the next line we actually check the received function name is legit
    FUNCTIONS[expression.functionName.toUpperCase() as FunctionName];
  if (handler === undefined) {
    return {
      status: "ERROR",
      message: `Unknown function ${expression.functionName}`,
    };
  }

  try {
    const result = handler(evaluatedOperandsValues);
    return { status: "SUCCESS", value: result };
  } catch (error) {
    let message = "Unknown Error";
    if (error instanceof Error) message = error.message;
    return {
      status: "ERROR",
      message: `${expression.functionName}: ${message}`,
    };
  }
}
