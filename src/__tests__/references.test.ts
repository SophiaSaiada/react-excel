import { expect, test } from "vitest";
import {
  collectDependents,
  getReferencedCells,
  topologicalSortAndCycleDetection,
} from "../core/references";
import { Cell, EvaluationResult, LiteralCellExpression } from "../core/types";
import {
  getExampleCellsWithRefs,
  getExampleCellsWithoutRefs,
  parseThenEvaluate,
  parseThenEvaluateShouldFail,
} from "./helpers";
import { parseCellRawValue } from "../core/parser";

const createCellWithDependencies = (dependencies: string[]) => ({
  dependencies,
  dependents: [],
  raw: "",
  parsed: new LiteralCellExpression(""),
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
  ["=ref(A1)", ["A1"]],
  ["=rEf(A1)", ["A1"]],
  ["=rEf(a1)", ["A1"]],
  ["=SUM(1,SUBTRACT(REF(A1)),REF(a2))", ["A1", "A2"]],
  ["=SUM(1,SUBTRACT(REF(a1)),REF(A1))", ["A1"]],
  ["=SUM(1,REF(A2),SUBTRACT(REF(A1)))", ["A2", "A1"]],
  ["=REF(Z99)", ["Z99"]],
  ["=SUM(REF(Z99),A1)", ["Z99"]],
  ["=SUM(Z99,A1)", []],
  ["=MAX(REF(A2))", ["A2"]],
  [
    "=SUM(1,REF(A1),REF(A2),REF(A3),SUBTRACT(REF(A1),SUBTRACT(REF(A4),SUBTRACT(REF(A5)))))",
    ["A1", "A2", "A3", "A4", "A5"],
  ],
])("test getReferencedCells: %s", (raw, expected) => {
  expect(getReferencedCells(parseCellRawValue(raw))).to.be.deep.equal({
    dynamicReferences: false,
    cells: expected,
  });
});

test.each([
  "=REF(REF(A2))",
  "=REF(SUM(A2))",
  "=REF(SUM(A2, 1))",
  "=SUM(REF(SUM(A2, 1)))",
  "=SUM(REF(REF(A2)))",
  "=MAX(REF(REF(A2)))",
  "=MAX(REF(REF(A2)),1)",
])("Dynamic cell references are not supported: %s", (raw) => {
  expect(getReferencedCells(parseCellRawValue(raw))).to.deep.equal({
    dynamicReferences: true,
    cells: [],
  });
});

test("test REF", () => {
  expect(
    parseThenEvaluate("=REF(A1)", getExampleCellsWithoutRefs())
  ).to.be.equal("1");
  expect(
    parseThenEvaluate("=SUM(REF(A1),REF(A1))", getExampleCellsWithoutRefs())
  ).to.be.equal("2");
  expect(
    parseThenEvaluate("=SUM(REF(A1),1,REF(B2))", getExampleCellsWithoutRefs())
  ).to.be.equal("4");
  expect(
    parseThenEvaluate("=MAX(REF(A1),1,REF(B2))", getExampleCellsWithoutRefs())
  ).to.be.equal("2");
  expect(
    parseThenEvaluate(
      "=SUM(REF(A1),1,SUBTRACT(REF(B2),REF(A1)))",
      getExampleCellsWithoutRefs()
    )
  ).to.be.equal("3");
});
test("referencing empty cell", () => {
  expect(
    parseThenEvaluate("=REF(A3)", getExampleCellsWithoutRefs())
  ).to.be.equal("");
  expect(
    parseThenEvaluate("=REF(ZZ0999)", getExampleCellsWithoutRefs())
  ).to.be.equal("");
  expect(
    parseThenEvaluate("=SUM(REF(ZZ0999),1)", getExampleCellsWithoutRefs())
  ).to.be.equal("NaN");
});

test("referencing range should fail", () => {
  expect(
    parseThenEvaluateShouldFail("=REF(B1, B2)", getExampleCellsWithoutRefs())
  ).to.be.equal("REF: Ranges aren't supported");
  expect(
    parseThenEvaluateShouldFail(
      "=REF(B1, B2, A3)",
      getExampleCellsWithoutRefs()
    )
  ).to.be.equal("REF: Ranges aren't supported");
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
