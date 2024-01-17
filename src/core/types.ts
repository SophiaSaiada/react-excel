import { FormulaCstNode } from "./generated/FormulaParser";

export type Cell = {
  raw: string;
  formula: FormulaCstNode | null;
  evaluationResult: EvaluationResult;
  dependencies: string[];
  dependents: string[];
};

export type EvaluationResultValue = string | number;

export type EvaluationResult =
  | { status: "PENDING" }
  | { status: "SUCCESS"; value: EvaluationResultValue }
  | { status: "ERROR"; message: string };
