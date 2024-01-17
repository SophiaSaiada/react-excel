import { type Cell, EvaluationResult, EvaluationResultValue } from "./types";
import { FUNCTIONS } from "./functions";
import FunctionName from "./FunctionName";
import { parser } from "./parser";
import { tokenMatcher } from "chevrotain";
import {
  AdditionExpressionCstChildren,
  AtomicExpressionCstChildren,
  FormulaCstChildren,
  FunctionCallCstChildren,
  ICstNodeVisitor,
  MultiplicationExpressionCstChildren,
  NumberLiteralCstChildren,
  ParenthesisExpressionCstChildren,
} from "./generated/FormulaParser";
import { Multi, Plus } from "./lexer";
import { POSITIVE_FLOAT_REGEX } from "../constants";
import { normalizeCellKey } from "../utils";

export const EMPTY_SUCCESSFUL_EVALUATION_RESULT: EvaluationResult = {
  status: "SUCCESS",
  value: "",
};

type VisitorParams = {
  directDependenciesEvaluationResult: ReadonlyMap<string, EvaluationResult>;
};

// ----------------- Interpreter -----------------
// Based on https://github.com/Chevrotain/chevrotain/blob/9edeb4b/examples/grammars/calculator/calculator_pure_grammar.js
// Obtains the default CstVisitor constructor to extend.
const BaseCstVisitor = parser.getBaseCstVisitorConstructor();

// All our semantics go into the visitor, completely separated from the grammar.
class FormulaInterpreter
  extends BaseCstVisitor
  implements ICstNodeVisitor<VisitorParams, EvaluationResult>
{
  constructor() {
    super();
    // This helper will detect any missing or redundant methods on this visitor
    this.validateVisitor();
  }

  formula(
    children: FormulaCstChildren,
    param?: VisitorParams | undefined
  ): EvaluationResult {
    return this.visit(children.additionExpression, param);
  }

  additionExpression(
    children: AdditionExpressionCstChildren,
    param?: VisitorParams | undefined
  ): EvaluationResult {
    const lhsResult: EvaluationResult = this.visit(children.lhs, param);
    if (lhsResult.status !== "SUCCESS") {
      // lazy operands evaluation
      return lhsResult;
    }

    // "rhs" key may be undefined as the grammar defines it as optional (MANY === zero or more).
    if (!children.rhs) {
      return lhsResult;
    }

    let result = lhsResult.value === "" ? 0 : lhsResult.value; // blank cells are treated as 0s
    for (const [i, rhsOperand] of children.rhs.entries()) {
      // there will be one operator for each rhs operand
      const rhsResult: EvaluationResult = this.visit(rhsOperand, param);
      if (rhsResult.status !== "SUCCESS") {
        return rhsResult;
      }

      const { value } = rhsResult;
      if (value === "") {
        // skip blank cells, as they anyway are treated as 0s
        continue;
      }

      if (typeof result === "string" || typeof value === "string") {
        return { status: "ERROR", message: "Cannot add or subtract a string" };
      }

      const operator = children.AdditionOperator![i]!;
      if (tokenMatcher(operator, Plus)) {
        result += value;
      } else {
        result -= value;
      }
    }
    return { status: "SUCCESS", value: result };
  }

  multiplicationExpression(
    children: MultiplicationExpressionCstChildren,
    param?: VisitorParams | undefined
  ): EvaluationResult {
    const lhsResult: EvaluationResult = this.visit(children.lhs, param);
    if (lhsResult.status !== "SUCCESS") {
      return lhsResult;
    }

    // "rhs" key may be undefined as the grammar defines it as optional (MANY === zero or more).
    if (!children.rhs) {
      return lhsResult;
    }

    let result = lhsResult.value === "" ? 0 : lhsResult.value;
    for (const [i, rhsOperand] of children.rhs.entries()) {
      // there will be one operator for each rhs operand
      const rhsResult: EvaluationResult = this.visit(rhsOperand, param);
      if (rhsResult.status !== "SUCCESS") {
        return rhsResult;
      }

      const operator = children.MultiplicationOperator![i]!;
      // we can't ignore blank values here, as they affect the result significantly
      const value = rhsResult.value === "" ? 0 : rhsResult.value;

      if (typeof result === "string" || typeof value === "string") {
        return {
          status: "ERROR",
          message: "Cannot multiply or divide a string",
        };
      }

      if (tokenMatcher(operator, Multi)) {
        result *= value;
      } else {
        result /= value;
      }
    }
    return { status: "SUCCESS", value: result };
  }

  numberLiteral(children: NumberLiteralCstChildren): EvaluationResult {
    const nonNegativeNumber = parseFloat(
      children.NonNegativeNumberLiteral[0].image
    );
    return {
      status: "SUCCESS",
      value: children.Minus ? -nonNegativeNumber : nonNegativeNumber,
    };
  }

  atomicExpression(
    children: AtomicExpressionCstChildren,
    param?: VisitorParams | undefined
  ): EvaluationResult {
    if (children.parenthesisExpression) {
      return this.visit(children.parenthesisExpression, param);
    }
    if (children.functionCall) {
      return this.visit(children.functionCall, param);
    }
    if (children.CellReferenceLiteral) {
      return handleRef(children.CellReferenceLiteral[0].image, param);
    }
    if (children.numberLiteral) {
      return this.visit(children.numberLiteral, param);
    }
    // it must be a string literal, there are no other options in atomicExpression
    return {
      status: "SUCCESS",
      value: unquoteString(children.StringLiteral![0].image),
    };
  }

  parenthesisExpression(
    children: ParenthesisExpressionCstChildren,
    param?: VisitorParams | undefined
  ): EvaluationResult {
    return this.visit(children.additionExpression, param);
  }

  functionCall(
    children: FunctionCallCstChildren,
    param?: VisitorParams | undefined
  ): EvaluationResult {
    // we cast to FunctionName here to satisfy the type checker,
    // but we actually check the received function name is legit when we attempt to find the handler
    const functionName =
      children.FunctionName![0].image.toUpperCase() as FunctionName;

    const handler = FUNCTIONS[functionName];
    if (handler === undefined) {
      return {
        status: "ERROR",
        message: `Unknown function ${functionName}`,
      };
    }

    const evaluatedOperandsValues: EvaluationResultValue[] = [];
    for (const operand of children.additionExpression ?? []) {
      // lazy evaluation of operands
      const operandEvaluationResult: EvaluationResult = this.visit(
        operand,
        param
      );
      if (operandEvaluationResult.status !== "SUCCESS") {
        return operandEvaluationResult;
      }
      evaluatedOperandsValues.push(operandEvaluationResult.value);
    }

    try {
      return { status: "SUCCESS", value: handler(evaluatedOperandsValues) };
    } catch (error) {
      return {
        status: "ERROR",
        message: `${functionName}: ${
          error instanceof Error ? error.message : "Unknown Error"
        }`,
      };
    }
  }
}

// We only need a single interpreter instance because our interpreter has no state.
const interpreter = new FormulaInterpreter();

export function unquoteString(quoted: string): string {
  return (
    quoted
      .substring(1, quoted.length - 1)
      // additional double quotes are used for escaped quotes
      .replace(/""/g, `"`)
  );
}

function handleRef(
  cellKey: string,
  param?: VisitorParams | undefined
): EvaluationResult {
  const normalizedCellKey = normalizeCellKey(cellKey);
  if (!param || !param.directDependenciesEvaluationResult) {
    throw new Error(
      "Missing visitor parameter directDependenciesEvaluationResult"
    );
  }
  const evaluationResult =
    param.directDependenciesEvaluationResult.get(normalizedCellKey);
  if (!evaluationResult) {
    throw new Error(
      `Evaluation result of cell ${normalizedCellKey} was not supplied to evaluator`
    );
  }
  return evaluationResult;
}

export function evaluate(
  cell: Cell,
  referencedCells: string[],
  cells: ReadonlyMap<string, Cell>
): EvaluationResult {
  const formula = cell.formula;
  if (formula === null) {
    return {
      status: "SUCCESS",
      // modify POSITIVE_FLOAT_REGEX to accept only full matches, and also negative numbers
      value: cell.raw.match(new RegExp(`^-?${POSITIVE_FLOAT_REGEX.source}$`))
        ? parseFloat(cell.raw)
        : cell.raw,
    };
  }

  const directDependenciesEvaluationResult = new Map<
    string,
    EvaluationResult
  >();
  for (const referencedCellKey of referencedCells) {
    const normalizedReferencedCellKey = normalizeCellKey(referencedCellKey);
    const referencedCell = cells.get(normalizedReferencedCellKey);
    if (!referencedCell) {
      directDependenciesEvaluationResult.set(
        normalizedReferencedCellKey,
        EMPTY_SUCCESSFUL_EVALUATION_RESULT
      );
    } else {
      const { evaluationResult } = referencedCell;
      if (evaluationResult.status === "PENDING") {
        return { status: "ERROR", message: "Dependency cycle detected" };
      }
      directDependenciesEvaluationResult.set(
        normalizedReferencedCellKey,
        evaluationResult
      );
    }
  }

  return interpreter.visit(formula, {
    directDependenciesEvaluationResult,
  });
}
