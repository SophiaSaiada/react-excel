import {
  Cell,
  CellExpression,
  FunctionCellExpression,
  LiteralCellExpression,
} from "./types";

export function collectDependents(
  cells: ReadonlyMap<string, Cell>,
  startCells: string[]
): Set<string> {
  const visited = new Set<string>();
  const toVisit = [...startCells];
  while (toVisit.length) {
    const current = toVisit.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const currentCell = cells.get(current);
    if (!currentCell) continue;
    toVisit.push(...currentCell.dependents);
  }
  return visited;
}

/**
 * Performs a topological sort and cycle detection. Based on Kahn's algorithm.
 *
 * @return {Object} An object containing the sorted sets and the sets that are either in a cycle or depend on a cycle.
 *   - `sorted`: An array of sets representing the sorted values. Each set represents a level in the topological sorting order.
 *   - `inOrDependsOnCycle`: A set of values that are either in a cycle or depend on a cycle. These values cannot be properly sorted.
 */
export function topologicalSortAndCycleDetection(
  cells: ReadonlyMap<string, Cell>
): {
  sorted: Set<string>[];
  inOrDependsOnCycle: Set<string>;
} {
  // out degree of cell X is the number of direct dependencies it has
  const outDegree: Map<string, number> = new Map(); // Space: All Keys: O(total cells), All Values: O(total dependencies)
  for (const [dependency, { dependents }] of cells.entries()) {
    // Time Complexity: O(total dependencies)
    if (!outDegree.has(dependency)) {
      outDegree.set(dependency, 0);
    }
    for (const dependent of dependents) {
      if (!outDegree.has(dependent)) {
        outDegree.set(dependent, 0);
      }
      outDegree.set(dependent, outDegree.get(dependent)! + 1);
    }
  }

  // we start with the cells that has no direct (and by that - also no indirect) dependencies
  const toVisit: { value: string; degree: number }[] = [];
  for (const [cell, degree] of outDegree.entries()) {
    // O(total cells)
    if (degree === 0) toVisit.push({ value: cell, degree: 0 });
  }

  const sorted: Set<string>[] = [];
  const inOrDependsOnCycle: Set<string> = new Set(outDegree.keys());

  // Total Time Complexity: O(total dependencies)
  while (toVisit.length) {
    // O(total cells), see comment before `toVisit.push`
    const current = toVisit.shift()!; // `toVisit` is FIFO, so we use `shift` instead of `pop`

    if (sorted.length <= current.degree) {
      sorted.push(new Set());
      if (sorted.length <= current.degree) {
        throw new Error(
          "This should not happen, as the cell that pushed `current` to `toVisit` has degree of `current.degree - 1`"
        );
      }
    }
    sorted[current.degree].add(current.value);

    // if we reached a cell it means that it's not in or depends on a cycle, as we start with cells with no dependencies,
    // and if there is a cycle and the rest of the cells depend on it - there are no cells to start with.
    // it's not that easy to grasp, so just try to sketch a 4 nodes graph
    // and perform this algorithm on it and you'll see it's true
    inOrDependsOnCycle.delete(current.value);

    // we push the direct dependents of `current` to the `toVisit`, if they don't have any other dependencies but `current`,
    // meaning they are ready to be evaluated by now
    for (const dependent of cells.get(current.value)?.dependents ?? []) {
      outDegree.set(dependent, outDegree.get(dependent)! - 1);
      if (outDegree.get(dependent)! === 0) {
        // Time Complexity: `outDegree.get(dependent)` is set once,
        // and keep decreased by one, so it happens once for each key in `outDegree`,
        // there are O(total cells) keys.
        toVisit.push({ value: dependent, degree: current.degree + 1 });
      }
    }
  }

  return { sorted, inOrDependsOnCycle };
}

export type ReferencedCells = {
  dynamicReferences: boolean;
  cells: string[];
};

export function getReferencedCells(
  expression: CellExpression
): ReferencedCells {
  if (expression instanceof LiteralCellExpression)
    return { dynamicReferences: false, cells: [] };
  if (expression instanceof FunctionCellExpression) {
    const { operands } = expression;

    // TODO: maybe introduce RefCellExpression instead of using FunctionCellExpression
    if (expression.functionName.toUpperCase() === "REF") {
      if (
        !operands.every((operand) => operand instanceof LiteralCellExpression)
      ) {
        return { dynamicReferences: true, cells: [] };
      }

      return {
        dynamicReferences: false,
        cells: (operands as LiteralCellExpression[]).map((operand) =>
          operand.value.toUpperCase()
        ),
      };
    }

    return expression.operands.reduce<ReferencedCells>(
      (acc, operand) => {
        if (acc.dynamicReferences) {
          return acc;
        }
        const operandReferencedCells = getReferencedCells(operand);
        return {
          dynamicReferences: operandReferencedCells.dynamicReferences,
          cells: [
            ...acc.cells,
            ...operandReferencedCells.cells.filter(
              (c) => !acc.cells.includes(c)
            ),
          ],
        };
      },
      { dynamicReferences: false, cells: [] }
    );
  }
  throw new Error(
    "Expected a FunctionCellExpression or a LiteralCellExpression"
  );
}
