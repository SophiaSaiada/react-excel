import { expect, test } from "vitest";
import { parseInput } from "../core/parser";

// Generation methodology:
// 1. Get the CST by debugging this tets case and pause to check the value.
// 2. Make sure it looks alright.
// 3. Get JSON paths using nidu's copy-json-path extension and add the path and the expected value.
test.each([
  [
    "=1-2+3+-4",
    [
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "1",
      ],
      [
        "children.additionExpression[0].children.AdditionOperator[0].image",
        "-",
      ],
      [
        "children.additionExpression[0].children.AdditionOperator[1].image",
        "+",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "2",
      ],
      [
        "children.additionExpression[0].children.rhs[1].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "3",
      ],
      [
        "children.additionExpression[0].children.rhs[2].children.lhs[0].children.numberLiteral[0].children.Minus[0].image",
        "-",
      ],
      [
        "children.additionExpression[0].children.rhs[2].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "4",
      ],
    ],
  ],
  [
    "=SUM(1,2)",
    [
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.FunctionName[0].image",
        "SUM",
      ],
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "1",
      ],
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[1].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "2",
      ],
    ],
  ],
  [
    "=SUBTRACT(SUM(1),3)",
    [
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.FunctionName[0].image",
        "SUBTRACT",
      ],
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.FunctionName[0].image",
        "SUM",
      ],
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "1",
      ],
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[1].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "3",
      ],
    ],
  ],
  [
    `=1-4*SUM(6,"hello""wor""\\l\\\\d","hi",AVG(-9,A2,3)/2,A3)+"hi"`,
    [
      [
        "children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "1",
      ],
      [
        "children.additionExpression[0].children.AdditionOperator[0].image",
        "-",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "4",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.MultiplicationOperator[0].image",
        "*",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.FunctionName[0].image",
        "SUM",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "6",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[1].children.lhs[0].children.lhs[0].children.StringLiteral[0].image",
        `"hello""wor""\\l\\\\d"`,
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.lhs[0].children.functionCall[0].children.FunctionName[0].image",
        "AVG",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.Minus[0].image",
        "-",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[0].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "9",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[1].children.lhs[0].children.lhs[0].children.CellReferenceLiteral[0].image",
        "A2",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.lhs[0].children.functionCall[0].children.additionExpression[2].children.lhs[0].children.lhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "3",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.MultiplicationOperator[0].image",
        "/",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[3].children.lhs[0].children.rhs[0].children.numberLiteral[0].children.NonNegativeNumberLiteral[0].image",
        "2",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[4].children.lhs[0].children.lhs[0].children.CellReferenceLiteral[0].image",
        "A3",
      ],
      [
        "children.additionExpression[0].children.AdditionOperator[1].image",
        "+",
      ],
      [
        "children.additionExpression[0].children.rhs[0].children.rhs[0].children.functionCall[0].children.additionExpression[2].children.lhs[0].children.lhs[0].children.StringLiteral[0].image",
        '"hi"',
      ],
    ],
  ],
])("%s", (formula, pathsAndExpectedValues) => {
  const node = parseInput(formula);
  for (const [path, expected] of pathsAndExpectedValues) {
    expect(node).to.nested.property(
      path,
      expected,
      JSON.stringify({ path, expected }, null, 2)
    );
  }
});

test.each([
  ["=-1", "=1-"],
  ["=1+2-1+(2)", "=1+2-1+2)"],
  ["=1+((2-1+2))", "=1+((2-1+2)"],
  ["=1", "1"],
  ["=0+2", "=+2"],
  ["=min()", "=min1()"],
  [`="aaa"`, `="aaa`],
  [`="aaa"""`, `=aaa"`],
  [`=""""`, `="""""`], // balanced vs unbalanced escaped quotes
  [`=""""""`, `="""""""`],
])("Invalid: %s and %s", (valid, invalid) => {
  expect(() => parseInput(valid)).to.not.throw();
  expect(() => parseInput(invalid)).to.throw();
});

test("ignore white spaces", () => {
  const removePositions = (obj: unknown) =>
    JSON.parse(
      JSON.stringify(obj).replace(
        // the token's positions change, but they aren't important for this test
        /"((endColumn)|(endOffset)|(startColumn)|(startOffset))": ?\d+,?|/g,
        ""
      )
    );
  expect(removePositions(parseInput("=1+2*min(2,1)/(2-1)"))).to.be.deep.eq(
    removePositions(parseInput("=  1 +2 *  min ( 2, 1) / ( 2- 1 )  "))
  );
});
