import { expect } from "vitest";
import { getReferencedCells } from "../core/references";
import { evaluate } from "../core/evaluator";
import { parseInput } from "../core/parser";
import { Cell } from "../core/types";
import baseSheet from "../baseSheet.json";
import { updateCellAndDependents } from "../core";
import { Immutable } from "immer";

export function parseThenEvaluate(
  raw: string,
  cells: Map<string, Cell> = new Map()
) {
  const formula = parseInput(raw);
  const result = evaluate(
    {
      raw,
      formula,
      evaluationResult: { status: "PENDING" },
      dependencies: getReferencedCells(formula),
      dependents: [],
    },
    getReferencedCells(formula),
    cells
  );
  expect(result).to.not.toBeFalsy();
  expect(result).to.have.property("status", "SUCCESS");
  expect(result).to.have.property("value");
  return (result as { value: string }).value;
}

export function parseThenEvaluateShouldFail(
  raw: string,
  cells: Map<string, Cell> = new Map()
) {
  const formula = parseInput(raw);
  const result = evaluate(
    {
      raw,
      formula,
      evaluationResult: { status: "PENDING" },
      dependencies: getReferencedCells(formula),
      dependents: [],
    },
    getReferencedCells(formula),
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
        formula: null,
        evaluationResult: {
          status: "SUCCESS",
          value: 1,
        },
      } as Cell,
    ],
    [
      "B2",
      {
        dependencies: [],
        dependents: [],
        raw: "2",
        formula: null,
        evaluationResult: {
          status: "SUCCESS",
          value: 2,
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
        raw: "=A1",
        formula: parseInput("=A1"),
        evaluationResult: {
          status: "SUCCESS",
          value: 1,
        },
      } as Cell,
    ],
    [
      "A3",
      {
        dependencies: ["A2", "B2"],
        dependents: [],
        raw: "=SUM(a2,B2)",
        formula: parseInput("=SUM(a2,B2)"),
        evaluationResult: {
          status: "SUCCESS",
          value: 3,
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
