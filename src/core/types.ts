import type FunctionName from "./FunctionName";

export interface CellExpression {}

export class LiteralCellExpression implements CellExpression {
  value: string;

  constructor(value: string) {
    this.value = value;
  }
}

export class FunctionCellExpression implements CellExpression {
  functionName: FunctionName;
  operands: CellExpression[];

  constructor(functionName: FunctionName, operands: CellExpression[]) {
    this.functionName = functionName;
    this.operands = operands;
  }
}

export type EvaluationResult =
  | { status: "SUCCESS"; value: string }
  | { status: "ERROR"; message: string };
