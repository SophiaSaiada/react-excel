import { type Cell } from "./types";
import { Draft, Immutable, produce, enableMapSet } from "immer";
import { parseInput } from "./parser";
import {
  collectDependents,
  topologicalSortAndCycleDetection,
} from "./references";
import { EMPTY_SUCCESSFUL_EVALUATION_RESULT, evaluate } from "./evaluator";
import { getReferencedCells } from "./references";

enableMapSet();

export const updateCellAndDependents = (
  immutableCells: Immutable<Map<string, Cell>>,
  key: string,
  raw: string
): Immutable<Map<string, Cell>> =>
  produce(immutableCells, (cells: Draft<Map<string, Cell>>) => {
    const formula = getFormula(raw);
    const referencedCells = getReferencedCells(formula);
    cells.set(key, {
      raw,
      formula,
      // `evaluationResult` will be invalidated anyway as a cell is a dependent of itself
      evaluationResult: EMPTY_SUCCESSFUL_EVALUATION_RESULT,
      // dependencies list will be updated in `updateDependenciesDependentsRelations`
      dependencies: cells.get(key)?.dependencies ?? [],
      // dependents list of a cell cannot be changed by changing only the cell
      // (as long as it is not a dependent of itself, in this case we take care of in `updateDependenciesDependentsRelations`)
      dependents: cells.get(key)?.dependents ?? [],
    });

    const allDependents = getAndInvalidateAllDependents(cells, key);
    updateDependenciesDependentsRelations(cells, key, referencedCells);
    // cell and its dependents will be evaluated in the next call (a cell is a dependent of itself)
    evaluateAndTriggerDependentsReEvaluation(cells, allDependents);
  });

function getFormula(raw: string) {
  if (!raw.match(/^=/)) {
    return null;
  }
  try {
    return parseInput(raw);
  } catch (e: unknown) {
    console.warn("ParsingOrLexingError", e); // TODO: give feedback to the user
    return null;
  }
}

function getAndInvalidateAllDependents(
  cells: Map<string, Draft<Cell>>,
  key: string
) {
  const allDependents = collectDependents(cells, [key]);
  allDependents.forEach((dependent) => {
    cells.get(dependent)!.evaluationResult = {
      status: "PENDING",
    };
  });
  return allDependents;
}

function updateDependenciesDependentsRelations(
  cells: Map<string, Draft<Cell>>,
  key: string,
  referencedCells: string[]
) {
  const pastDependencies = cells
    .get(key)!
    .dependencies.filter((k) => !referencedCells.includes(k));
  cells.get(key)!.dependencies = referencedCells;
  for (const pastDependency of pastDependencies) {
    // release cell from irrelevant dependents cell's dependencies lists
    cells.get(pastDependency)!.dependents = cells
      .get(pastDependency)!
      .dependents.filter((k) => k !== key);
  }

  // update new dependencies cells' dependencies list
  referencedCells.forEach((referencedCell) => {
    if (!cells.has(referencedCell)) {
      cells.set(referencedCell, {
        raw: "",
        formula: null,
        evaluationResult: EMPTY_SUCCESSFUL_EVALUATION_RESULT,
        dependencies: [],
        dependents: [],
      });
    }
    if (!cells.get(referencedCell)!.dependents.includes(key)) {
      cells.get(referencedCell)!.dependents.push(key);
    }
  });
}

function evaluateAndTriggerDependentsReEvaluation(
  cells: Map<string, Draft<Cell>>,
  allDependents: Set<string>
) {
  const allDependentsAsCells: Map<string, Cell> = new Map();
  allDependents.forEach((dependent) => {
    allDependentsAsCells.set(dependent, cells.get(dependent)!);
  });
  const { sorted, inOrDependsOnCycle } =
    topologicalSortAndCycleDetection(allDependentsAsCells);
  // evaluate inOrDependsOnCycle cells last, the dependency cycle error will propagate to them
  sorted.push(inOrDependsOnCycle);
  sorted.forEach((level) =>
    level.forEach((dependentKey) => {
      const dependent = cells.get(dependentKey)!; // non-existing cell can't be a dependent og another
      cells.get(dependentKey)!.evaluationResult = evaluate(
        dependent,
        getReferencedCells(dependent.formula),
        cells
      );
    })
  );
}

export const exportsForTesting = (() => {
  if (process.env.NODE_ENV === "test") {
    return {
      getAndInvalidateAllDependents,
      updateDependenciesDependentsRelations,
      evaluateAndTriggerDependentsReEvaluation,
    };
  }
  return null;
})();
