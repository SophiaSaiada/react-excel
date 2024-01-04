import { expect, test, vi } from "vitest";
import {
  getExampleCellsWithRefs,
  getExampleComplexCellsWithRefs,
} from "./helpers";
import { exportsForTesting, updateCellAndDependents } from "../core/index";
import * as evaluator from "../core/evaluator";
import { getReferencedCells } from "../core/references";
import * as references from "../core/references";
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
      updateDependenciesDependentsRelations(cells, key, {
        dynamicReferences: true,
        cells: referencedCells,
      });
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
    const spy = vi.spyOn(evaluator, "evaluateCellExpression");

    evaluateAndTriggerDependentsReEvaluation(
      cells,
      new Set([...dependents].reverse())
    );
    expect(spy).toBeCalledTimes(dependents.length);
    for (const [index, key] of dependents.entries()) {
      expect(spy).to.have.been.nthCalledWith(
        index + 1,
        cells.get(key)!.parsed,
        getReferencedCells(cells.get(key)!.parsed),
        expect.anything()
      );
    }
  }
);

const DEPENDENCY_CYCLE_ERROR = { error: "Dependency cycle detected" };

test("reactivity", () => {
  let cells = getExampleComplexCellsWithRefs();

  function expectValues(
    action: { key: string; value: string } | undefined,
    expectedValues: Record<string, string | { error: string }>
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
    A1: "10",
    B1: "+1 =>",
    C1: "11",
    C2: "+ A1 =>",
    D2: "21",
    D3: "MAX(D2,",
    E3: "9",
    F3: ") =>",
    G3: "21",
  });

  expectValues(
    { key: "A1", value: "5" },
    {
      A1: "5",
      B1: "+1 =>",
      C1: "6",
      C2: "+ A1 =>",
      D2: "11",
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "11",
    }
  );

  expectValues(
    { key: "A1", value: "2" },
    {
      A1: "2",
      B1: "+1 =>",
      C1: "3",
      C2: "+ A1 =>",
      D2: "5",
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "9",
    }
  );

  expectValues(
    { key: "A1", value: "" },
    {
      A1: "",
      B1: "+1 =>",
      C1: "NaN",
      C2: "+ A1 =>",
      D2: "NaN",
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "NaN",
    }
  );

  expectValues(
    { key: "A1", value: "=ReF(d2)" },
    {
      A1: DEPENDENCY_CYCLE_ERROR,
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: DEPENDENCY_CYCLE_ERROR,
    }
  );

  expectValues(
    { key: "A1", value: "hi" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: "NaN",
      C2: "+ A1 =>",
      D2: "NaN",
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "NaN",
    }
  );

  expectValues(
    { key: "C1", value: "=REF(D2)" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: DEPENDENCY_CYCLE_ERROR,
    }
  );

  expectValues(
    { key: "C1", value: "=sum(ref(a1),2)" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: "NaN",
      C2: "+ A1 =>",
      D2: "NaN",
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "NaN",
    }
  );

  expectValues(
    { key: "C1", value: "=REF(c1)" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: DEPENDENCY_CYCLE_ERROR,
    }
  );

  expectValues(
    { key: "G3", value: "=ref(a1)" },
    {
      A1: "hi",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "hi",
    }
  );

  expectValues(
    { key: "A1", value: "=SUM(1,2,3)" },
    {
      A1: "6",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "6",
    }
  );

  expectValues(
    { key: "G4", value: "=SUM(ref(a1),ref(a1),1,ref(g3))" },
    {
      A1: "6",
      B1: "+1 =>",
      C1: DEPENDENCY_CYCLE_ERROR,
      C2: "+ A1 =>",
      D2: DEPENDENCY_CYCLE_ERROR,
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "6",
      G4: "19",
    }
  );

  expectValues(
    { key: "C1", value: "=SUM(REF(a1),1)" },
    {
      A1: "6",
      B1: "+1 =>",
      C1: "7",
      C2: "+ A1 =>",
      D2: "13",
      D3: "MAX(D2,",
      E3: "9",
      F3: ") =>",
      G3: "6",
      G4: "19",
    }
  );
});
