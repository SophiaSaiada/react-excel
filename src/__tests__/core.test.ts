import { expect, test, vi } from "vitest";
import {
  getExampleCellsWithRefs,
  getExampleComplexCellsWithRefs,
} from "./helpers";
import { exportsForTesting, updateCellAndDependents } from "../core/index";
import * as evaluator from "../core/evaluator";
import { getReferencedCells } from "../core/references";
import * as references from "../core/references";
import { EvaluationResultValue } from "../core/types";
const {
  updateDependenciesDependentsRelations,
  evaluateAndTriggerDependentsReEvaluation,
} = exportsForTesting!;

test.each([
  ["A3", [["A2", "B2"]], { A1: ["A2"], A2: ["A3"], B2: ["A3"], A3: [] }], // original state of exampleCellsWithRefs
  ["A1", [["B2"], []], { A1: ["A2"], A2: ["A3"], B2: ["A3"], A3: [] }],
  ["A1", [["A1"], []], { A1: ["A2"], A2: ["A3"], B2: ["A3"], A3: [] }],
  ["A3", [[]], { A1: ["A2"], A2: [], B2: [], A3: [] }],
  ["A2", [["A3"]], { A1: [], A2: ["A3"], B2: ["A3"], A3: ["A2"] }],
  ["A2", [["A3"], ["A1"]], { A1: ["A2"], A2: ["A3"], B2: ["A3"], A3: [] }],
  [
    "A2",
    [["A3"], ["A1"], ["A3"]],
    { A1: [], A2: ["A3"], B2: ["A3"], A3: ["A2"] },
  ],
  ["A2", [["A3", "B2"]], { A1: [], A2: ["A3"], B2: ["A3", "A2"], A3: ["A2"] }],
  ["A2", [["Z9"]], { A1: [], A2: ["A3"], B2: ["A3"], A3: [], Z9: ["A2"] }],
  [
    "A2",
    [["Z9", "Z9"]],
    { A1: [], A2: ["A3"], B2: ["A3"], A3: [], Z9: ["A2"] },
  ],
])(
  "updateDependenciesDependentsRelations: %s(%o) => %o",
  (key, referencedCellsSteps, expected) => {
    const cells = getExampleCellsWithRefs();
    for (const referencedCells of referencedCellsSteps) {
      updateDependenciesDependentsRelations(cells, key, referencedCells);
    }
    for (const [k, v] of Object.entries(expected)) {
      expect(cells.get(k)!.dependents).to.deep.equal(
        v,
        `${k} dependents list does not match`
      );
    }
  }
);

test.each([[["A1", "A2", "A3"]], [["A1", "B2", "A2", "A3"]], [["B2", "A3"]]])(
  "evaluateAndTriggerDependentsReEvaluation %o to be called in order",
  (dependents) => {
    const cells = getExampleCellsWithRefs();
    vi.spyOn(
      references,
      "topologicalSortAndCycleDetection"
    ).mockImplementationOnce((cells) => {
      const base = references.topologicalSortAndCycleDetection(cells);
      // @ts-expect-error: this function returns sets, which don't have any order to them.
      // We need to make it a little more predictable for this test.
      base.sorted = base.sorted.map((s) => [...s].sort());
      return base;
    });
    const spy = vi.spyOn(evaluator, "evaluate");

    evaluateAndTriggerDependentsReEvaluation(
      cells,
      new Set([...dependents].reverse())
    );
    expect(spy).toBeCalledTimes(dependents.length);
    for (const [index, key] of dependents.entries()) {
      expect(spy).to.have.been.nthCalledWith(
        index + 1,
        cells.get(key)!,
        getReferencedCells(cells.get(key)!.formula),
        expect.anything()
      );
    }
  }
);

test.each([
  // valid formula, valid result, invalid formula
  ["=-1", -1, "=1-"],
  ["=1+2-1+(2)", 4, "=1+2-1+2)"],
  ["=1+((2-1+2))", 4, "=1+((2-1+2)"],
  ["=1", 1, "1"],
  ["=0+2", 2, "=+2"],
  ["=min(1)", 1, "=min1(1)"],
  [`="aaa"`, "aaa", `="aaa`],
  ["=1+2", 3, "1+2"],
  [`="aaa"""`, `aaa"`, `=aaa"`],
])(
  "Valid %s results in %s, invalid %s results in raw value",
  (validFormula, validResult, invalid) => {
    let cells = getExampleComplexCellsWithRefs();
    cells = updateCellAndDependents(cells, "A1", validFormula);
    vi.spyOn(console, "warn").mockImplementationOnce(() => undefined);
    cells = updateCellAndDependents(cells, "B2", invalid);
    expect(cells.get("A1")!.evaluationResult).to.have.property(
      "status",
      "SUCCESS"
    );
    expect(cells.get("A1")!.evaluationResult).to.have.property(
      "value",
      validResult
    );
    expect(cells.get("B2")!.evaluationResult).to.have.property(
      "status",
      "SUCCESS"
    );
    expect(cells.get("B2")!.evaluationResult).to.have.property(
      "value",
      invalid === "1" ? 1 : invalid // special case in which the value is casted to a number
    );
  }
);

const DEPENDENCY_CYCLE_ERROR = { error: "Dependency cycle detected" };

test("reactivity", () => {
  let cells = getExampleComplexCellsWithRefs();

  function expectValues(
    action: { key: string; value: string } | undefined,
    expectedValues: Record<string, EvaluationResultValue | { error: string }>
  ) {
    if (action !== undefined) {
      cells = updateCellAndDependents(cells, action.key, action.value);
    }

    for (const [key, expected] of Object.entries(expectedValues)) {
      const label =
        (action === undefined ? "base" : `${action.key} => ${action.value}`) +
        `: ${key}`;
      const evaluationResult = cells.get(key)!.evaluationResult;
      expect(
        evaluationResult.status,
        label +
          ": " +
          (evaluationResult.status === "ERROR"
            ? evaluationResult.message
            : evaluationResult.status)
      ).to.equal(expected instanceof Object ? "ERROR" : "SUCCESS");
      if (expected instanceof Object) {
        expect(evaluationResult, label).property("message", expected.error);
      } else {
        expect(evaluationResult, label).property("value", expected);
      }
    }
  }

  expectValues(undefined, {
    A1: 10,
    B1: "+1 =>",
    C1: 11,
    C2: "+ A1 =>",
    D2: 21,
    D3: "MAX(D2,",
    E3: 9,
    F3: ") =>",
    G3: 21,
  });

  expectValues(
    { key: "A1", value: "5" },
    {
      A1: 5,
      B1: "+1 =>",
      C1: 6,
      C2: "+ A1 =>",
      D2: 11,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: 11,
    }
  );

  expectValues(
    { key: "A1", value: "2" },
    {
      A1: 2,
      B1: "+1 =>",
      C1: 3,
      C2: "+ A1 =>",
      D2: 5,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: 9,
    }
  );

  expectValues(
    { key: "A1", value: "" },
    {
      A1: "",
      B1: "+1 =>",
      C1: 1,
      C2: "+ A1 =>",
      D2: 1,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: 9,
    }
  );

  expectValues(
    { key: "A1", value: "=d2" },
    {
      A1: DEPENDENCY_CYCLE_ERROR,
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: DEPENDENCY_CYCLE_ERROR,
    }
  );

  expectValues(
    { key: "A1", value: "hi" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: { error: "Cannot add or subtract a string" },
      C2: "+ A1 =>",
      D2: { error: "Cannot add or subtract a string" },
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: { error: "Cannot add or subtract a string" },
    }
  );

  expectValues(
    { key: "C1", value: "=D2" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: DEPENDENCY_CYCLE_ERROR,
    }
  );

  expectValues(
    { key: "C1", value: "=a1+(2)" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: { error: "Cannot add or subtract a string" },
      C2: "+ A1 =>",
      D2: { error: "Cannot add or subtract a string" },
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: { error: "Cannot add or subtract a string" },
    }
  );

  expectValues(
    { key: "C1", value: "=c1" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: DEPENDENCY_CYCLE_ERROR,
    }
  );

  expectValues(
    { key: "G3", value: "=a1" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: "hi",
    }
  );

  expectValues(
    { key: "A1", value: "=1+2+3" },
    {
      A1: 6,
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: 6,
    }
  );

  expectValues(
    { key: "G4", value: "=a1+a1+1+g3" },
    {
      A1: 6,
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: 6,
      G4: 19,
    }
  );

  expectValues(
    { key: "C1", value: "=a1+1" },
    {
      A1: 6,
      B1: "+1 =>",
      C1: 7,
      C2: "+ A1 =>",
      D2: 13,
      D3: "MAX(D2,",
      E3: 9,
      F3: ") =>",
      G3: 6,
      G4: 19,
    }
  );
});
