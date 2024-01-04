import { expect } from "vitest";
import { getReferencedCells } from "../core/references";
import { evaluateCellExpression } from "../core/evaluator";
import { parseCellRawValue } from "../core/parser";
import { Cell, LiteralCellExpression } from "../core/types";
import baseSheet from "../baseSheet.json";
import { updateCellAndDependents } from "../core";
import { Immutable } from "immer";

export function parseThenEvaluate(
  rawValue: string,
  cells: Map<string, Cell> = new Map()
) {
  const cellExpression = parseCellRawValue(rawValue);
  const result = evaluateCellExpression(
    cellExpression,
    getReferencedCells(cellExpression),
    cells
  );
  expect(result).to.not.toBeFalsy();
  expect(result).to.have.property("status", "SUCCESS");
  expect(result).to.have.property("value");
  return (result as { value: string }).value;
}

export function parseThenEvaluateShouldFail(
  rawValue: string,
  cells: Map<string, Cell> = new Map()
) {
  const cellExpression = parseCellRawValue(rawValue);
  const result = evaluateCellExpression(
    cellExpression,
    getReferencedCells(cellExpression),
    cells
  );
  expect(result).to.not.toBeFalsy();
  expect(result).to.have.property("status", "ERROR");
  expect(result).to.have.property("message");
  return (result as { message: string }).message;
}

export const getExampleCellsWithoutRefs = () =>
  new Map([
    [
      "A1",
      {
        dependencies: [],
        dependents: [],
        raw: "1",
        parsed: new LiteralCellExpression("1"),
        evaluationResult: {
          status: "SUCCESS",
          value: "1",
        },
      } as Cell,
    ],
    [
      "B2",
      {
        dependencies: [],
        dependents: [],
        raw: "2",
        parsed: new LiteralCellExpression("2"),
        evaluationResult: {
          status: "SUCCESS",
          value: "2",
        },
      } as Cell,
    ],
  ]);

export const getExampleCellsWithRefs = () => {
  const base = new Map([
    ...getExampleCellsWithoutRefs().entries(),
    [
      "A2",
      {
        dependencies: ["A1"],
        dependents: ["A3"],
        raw: "=ref(A1)",
        parsed: parseCellRawValue("=ref(A1)"),
        evaluationResult: {
          status: "SUCCESS",
          value: "1",
        },
      } as Cell,
    ],
    [
      "A3",
      {
        dependencies: ["A2", "B2"],
        dependents: [],
        raw: "=SUM(ref(A2),REF(B1))",
        parsed: parseCellRawValue("=SUM(ref(A2),REF(B2))"),
        evaluationResult: {
          status: "SUCCESS",
          value: "2",
        },
      } as Cell,
    ],
  ]);
  base.get("A1")!.dependents.push("A2");
  base.get("B2")!.dependents.push("A3");
  return base;
};

export const getExampleComplexCellsWithRefs = () => {
  let cells: Immutable<Map<string, Cell>> = new Map();
  for (const [key, value] of Object.entries(baseSheet)) {
    cells = updateCellAndDependents(cells, key, value);
  }
  return cells;
};
