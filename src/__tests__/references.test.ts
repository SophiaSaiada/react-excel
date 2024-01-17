import { expect, test } from "vitest";
import {
  collectDependents,
  getReferencedCells,
  topologicalSortAndCycleDetection,
} from "../core/references";
import { Cell, EvaluationResult } from "../core/types";
import {
  getExampleCellsWithRefs,
  getExampleCellsWithoutRefs,
  parseThenEvaluate,
} from "./helpers";
import { parseInput } from "../core/parser";

const createCellWithDependencies = (dependencies: string[]) => ({
  dependencies,
  dependents: [],
  raw: "",
  formula: null,
  evaluationResult: { status: "PENDING" } as EvaluationResult,
});

test.each([
  [
    "three cells' cycle",
    [
      ["A1", "B1"],
      ["B1", "C1"],
      ["C1", "A1"],
    ],
    { sorted: [], inOrDependsOnCycle: ["A1", "B1", "C1"] },
  ],
  [
    "two cells depend on another",
    [
      ["A1", "B1"],
      ["C1", "B1"],
    ],
    { sorted: [["B1"], ["A1", "C1"]], inOrDependsOnCycle: [] },
  ],
  [
    "two cells' cycle, two cells that don't depends on the cycle",
    [
      ["B1", "D1"],
      ["D1", "A1"],
      ["A1", "D1"],
      ["A1", "C1"],
      ["C1", "C2"],
    ],
    { sorted: [["C2"], ["C1"]], inOrDependsOnCycle: ["A1", "D1", "B1"] },
  ],
  [
    "no cycle",
    [
      ["C1", "A1"],
      ["C1", "B1"],
      ["A1", "D3"],
      ["B1", "D1"],
      ["B1", "D3"],
      ["D1", "A1"],
    ],
    {
      sorted: [["D3"], ["A1"], ["D1"], ["B1"], ["C1"]],
      inOrDependsOnCycle: [],
    },
  ],
  [
    "two sub-graphs that aren't connected - 'two cells' cycle, two cells that don't depends on the cycle' and 'no cycle'",
    [
      ["AB1", "AD1"],
      ["AD1", "AA1"],
      ["AA1", "AD1"],
      ["AA1", "AC1"],
      ["AC1", "AC2"],
      ["C1", "A1"],
      ["C1", "B1"],
      ["A1", "D3"],
      ["B1", "D1"],
      ["B1", "D3"],
      ["D1", "A1"],
    ],
    {
      sorted: [["AC2", "D3"], ["AC1", "A1"], ["D1"], ["B1"], ["C1"]],
      inOrDependsOnCycle: ["AA1", "AD1", "AB1"],
    },
  ],
  [
    "5 nodes, many cycles, one node that not depends on a cycle",
    [
      ["A1", "B1"],
      ["B1", "C1"],
      ["C1", "A1"],
      ["A1", "D1"],
      ["B1", "D1"],
      ["C1", "D1"],
      ["D1", "A1"],
      ["D1", "B1"],
      ["D1", "C1"],
      ["D1", "E1"],
    ],
    { sorted: [["E1"]], inOrDependsOnCycle: ["A1", "B1", "C1", "D1"] },
  ],
])(
  "%s",
  (
    _: string,
    relations: string[][],
    expected: { sorted: string[][]; inOrDependsOnCycle: string[] }
  ) => {
    const cells = relations.reduce((current, [dependent, dependency]) => {
      if (!current.has(dependent)) {
        current.set(dependent, createCellWithDependencies([]));
      }
      current.get(dependent)!.dependencies = [
        ...current.get(dependent)!.dependencies,
        dependency,
      ];

      if (!current.has(dependency)) {
        current.set(dependency, createCellWithDependencies([]));
      }
      current.get(dependency)!.dependents = [
        ...current.get(dependency)!.dependents,
        dependent,
      ];

      return current;
    }, new Map<string, Cell>());

    const result = topologicalSortAndCycleDetection(cells);
    expect(result.sorted).to.be.deep.equal(
      expected.sorted.map((l) => new Set(l))
    );
    expect([...result.inOrDependsOnCycle].sort()).to.be.deep.equal(
      expected.inOrDependsOnCycle.sort()
    );
  }
);

test("topological sort single cell", () => {
  const result = topologicalSortAndCycleDetection(
    new Map([["A1", createCellWithDependencies([])]])
  );
  expect(result.sorted).to.be.deep.equal([new Set(["A1"])]);
  expect(result.inOrDependsOnCycle).to.be.deep.equal(new Set());
});

test.each([
  ["=A1", ["A1"]],
  ["=a1", ["A1"]],
  ["=SUM(1,SUBTRACT(A1),a2)", ["A1", "A2"]],
  ["=SUM(1,SUBTRACT(a1),A1)", ["A1"]],
  ["=SUM(1,A2,SUBTRACT(A1))", ["A2", "A1"]],
  ["=Z99", ["Z99"]],
  [`=SUM(Z99,"A1")`, ["Z99"]],
  [`=SUM("Z99","A1")`, []],
  ["=MAX(A2)", ["A2"]],
  [
    "=SUM(1,A1,A2,A3,SUBTRACT(A1,SUBTRACT(A4,SUBTRACT(A5))))",
    ["A1", "A2", "A3", "A4", "A5"],
  ],
])("test getReferencedCells: %s", (raw, expected) => {
  expect(getReferencedCells(parseInput(raw))).to.be.deep.equal(expected);
});

test.each([
  ["=A1", 1],
  ["=A1+A1", 2],
  ["=A1+1+(B2)", 4],
  ["=MAX(A1,1,B2)", 2],
  ["=A1+1+B2-A1", 3],
])("test REF: %s => %s", (raw, expected) => {
  expect(parseThenEvaluate(raw, getExampleCellsWithoutRefs())).to.be.equal(
    expected
  );
});
test("referencing empty cell", () => {
  expect(parseThenEvaluate("=A3", getExampleCellsWithoutRefs())).to.be.equal(
    ""
  );
  expect(
    parseThenEvaluate("=ZZ0999", getExampleCellsWithoutRefs())
  ).to.be.equal("");
  expect(
    parseThenEvaluate("=ZZ0999+1", getExampleCellsWithoutRefs())
  ).to.be.equal(1);
});

test("collectDependents", () => {
  expect(collectDependents(getExampleCellsWithRefs(), ["A3"])).to.deep.equal(
    new Set(["A3"])
  );
  expect(collectDependents(getExampleCellsWithRefs(), ["A2"])).to.deep.equal(
    new Set(["A2", "A3"])
  );
  expect(collectDependents(getExampleCellsWithRefs(), ["B2"])).to.deep.equal(
    new Set(["B2", "A3"])
  );
  expect(collectDependents(getExampleCellsWithRefs(), ["A1"])).to.deep.equal(
    new Set(["A1", "A2", "A3"])
  );
});
