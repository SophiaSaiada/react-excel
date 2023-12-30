import type { CellExpression } from "./types";
import {
  FunctionCellExpression,
  LiteralCellExpression,
} from "./types";
import FunctionName from "./FunctionName";

export function parseCellRawValue(raw: string): CellExpression {
  if (!raw.match(/^=/)) {
    return new LiteralCellExpression(raw);
  }

  const formula = raw.slice(1);
  let leftPointer = 0,
    rightPointer = 0;

  const pathToRoot: FunctionCellExpression[] = [];

  while (rightPointer < formula.length) {
    if (formula[rightPointer] === "(") {
      const functionExpression = new FunctionCellExpression(
        formula.slice(leftPointer, rightPointer) as FunctionName,
        []
      );
      if (pathToRoot.length) {
        pathToRoot[pathToRoot.length - 1].operands.push(functionExpression);
      }
      pathToRoot.push(functionExpression);

      leftPointer = rightPointer + 1;
      rightPointer += 1;
    } else if (formula[rightPointer] === ",") {
      if (pathToRoot.length) {
        if (leftPointer !== rightPointer) {
          // ignoring blank operands
          pathToRoot[pathToRoot.length - 1].operands.push(
            new LiteralCellExpression(formula.slice(leftPointer, rightPointer))
          );
        }
      } else {
        return new LiteralCellExpression(raw); // if a formula stars with a literal instead of function, we simply return the formula as is
      }
      leftPointer = rightPointer + 1;
      rightPointer += 1;
    } else if (formula[rightPointer] === ")") {
      if (pathToRoot.length) {
        if (leftPointer !== rightPointer) {
          // ignoring blank operands
          pathToRoot[pathToRoot.length - 1].operands.push(
            new LiteralCellExpression(formula.slice(leftPointer, rightPointer))
          );
        }
      } else {
        console.warn("Saw closing parenthesis without opening parenthesis");
        return new LiteralCellExpression(raw);
      }

      const parent = pathToRoot.pop()!; // pathToRoot.length was >1 before popping, as asserted in the previous if statement
      if (!pathToRoot.length) {
        if (rightPointer < formula.length - 1) {
          console.warn("Finished parsing but still have more characters");
          return new LiteralCellExpression(raw);
        }
        return parent;
      }

      leftPointer = rightPointer + 1;
      rightPointer += 1;
    } else {
      rightPointer += 1;
    }
  }
  return new LiteralCellExpression(raw);
}
