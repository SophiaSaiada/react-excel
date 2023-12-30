import { expect, test } from "vitest";
import { type CellExpression } from "../core/types";
import { parseCellRawValue } from "../core/parser";
import { FunctionCellExpression, LiteralCellExpression } from "../core/types";

function expectFunctionCellExpression(
  cellExpression: CellExpression,
  expectedFunctionName: string,
  expectedOperandsLength: number
): CellExpression[] {
  expect(cellExpression).to.be.instanceOf(FunctionCellExpression);
  expect(cellExpression).to.have.property("functionName", expectedFunctionName);
  expect(cellExpression)
    .to.have.property("operands")
    .with.lengthOf(expectedOperandsLength);
  return (cellExpression as FunctionCellExpression).operands;
}

function expectLiteralCellExpression(
  cellExpression: CellExpression,
  expectedValue: string
) {
  expect(cellExpression).to.be.instanceOf(LiteralCellExpression);
  expect(cellExpression).to.have.property("value", expectedValue);
}

test("single function call", () => {
  const operands = expectFunctionCellExpression(
    parseCellRawValue("=SUM(1,A)"),
    "SUM",
    2
  );
  expectLiteralCellExpression(operands[0], "1");
  expectLiteralCellExpression(operands[1], "A");
});

test("nested function call", () => {
  const operands = expectFunctionCellExpression(
    parseCellRawValue("=SUBTRACT(SUM(1,2),C)"),
    "SUBTRACT",
    2
  );
  const sumOperands = expectFunctionCellExpression(operands[0], "SUM", 2);
  expectLiteralCellExpression(sumOperands[0], "1");
  expectLiteralCellExpression(sumOperands[1], "2");
  expectLiteralCellExpression(operands[1], "C");
});

test("literal", () => {
  expectLiteralCellExpression(
    parseCellRawValue("SUBTRACT(SUM(1,2),3)"),
    "SUBTRACT(SUM(1,2),3)"
  );
  expectLiteralCellExpression(
    parseCellRawValue("SUBTRACT(SUM(1,2),3))"),
    "SUBTRACT(SUM(1,2),3))"
  );
  expectLiteralCellExpression(parseCellRawValue("=1,2"), "=1,2");
});

test("invalid formulas", () => {
  expectLiteralCellExpression(
    parseCellRawValue("=SUBTRACT((SUM(1,2),3)"),
    "=SUBTRACT((SUM(1,2),3)"
  );
  expectLiteralCellExpression(
    parseCellRawValue("=SUBTRACT(SUM(1,2),3))"),
    "=SUBTRACT(SUM(1,2),3))"
  );
  expectLiteralCellExpression(parseCellRawValue("=SUM(1,2))"), "=SUM(1,2))");
  expectLiteralCellExpression(parseCellRawValue("=SUM((1,2)"), "=SUM((1,2)");
  expectLiteralCellExpression(parseCellRawValue("=2)"), "=2)");
  expectLiteralCellExpression(parseCellRawValue("=(2"), "=(2");

  expectLiteralCellExpression(parseCellRawValue("=2"), "=2");
  expectLiteralCellExpression(parseCellRawValue("=AB"), "=AB");
});
