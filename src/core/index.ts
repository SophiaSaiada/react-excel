import { type Cell, LiteralCellExpression } from "./types";
import { Draft, Immutable, produce, enableMapSet } from "immer";
import { parseCellRawValue } from "./parser";
import {
  ReferencedCells,
  collectDependents,
  topologicalSortAndCycleDetection,
} from "./references";
import {
  EMPTY_SUCCESSFUL_EVALUATION_RESULT,
  evaluateCellExpression,
} from "./evaluator";
import { getReferencedCells } from "./references";

enableMapSet();

export const updateCellAndDependents = (
  immutableCells: Immutable<Map<string, Cell>>,
  key: string,
  raw: string
): Immutable<Map<string, Cell>> =>
  produce(immutableCells, (cells: Draft<Map<string, Cell>>) => {
    const cellExpression = parseCellRawValue(raw);
    const referencedCells = getReferencedCells(cellExpression);
    cells.set(key, {
      raw,
      parsed: cellExpression,
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
  referencedCells: ReferencedCells
) {
  const pastDependencies = cells
    .get(key)!
    .dependencies.filter((k) => !referencedCells.cells.includes(k));
  cells.get(key)!.dependencies = referencedCells.cells;
  for (const pastDependency of pastDependencies) {
    // release cell from irrelevant dependents cell's dependencies lists
    cells.get(pastDependency)!.dependents = cells
      .get(pastDependency)!
      .dependents.filter((k) => k !== key);
  }

  // update new dependencies cells' dependencies list
  referencedCells.cells.forEach((referencedCell) => {
    if (!cells.has(referencedCell)) {
      cells.set(referencedCell, {
        raw: "",
        parsed: new LiteralCellExpression(""),
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
    level.forEach((dependent) => {
      const dependentParsed = cells.get(dependent)!.parsed; // non-existing cell can't be a dependent og another
      cells.get(dependent)!.evaluationResult = evaluateCellExpression(
        dependentParsed,
        getReferencedCells(dependentParsed),
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
