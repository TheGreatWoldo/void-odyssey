import { NodeType } from '@/domain/navigation/node-type';
import { NodeTypeStrategy, PositionedNodeStub } from '@/domain/navigation/route/strategies/node-type-strategy';
import { TypeAllocationStrategy } from '@/domain/navigation/route/strategies/type-allocation-strategy';

/**
 * Assigns node types by visiting each TypeAllocationStrategy in priority order
 * and allocating from the pool of unassigned intermediate nodes.
 *
 * After all strategies have run, remaining nodes default to Empty.
 *
 * Because each strategy runs before the next, earlier entries have first pick —
 * place scarcer or more constrained types first.
 */
export class LayeredAllocationStrategy implements NodeTypeStrategy {
  constructor(private readonly strategies: readonly TypeAllocationStrategy[]) {}

  assignAll(
    nodes: readonly PositionedNodeStub[],
    totalLayers: number
  ): ReadonlyMap<string, NodeType> {
    const result = new Map<string, NodeType>();
    const unassigned = new Set(nodes.map((n) => n.id));

    for (const strategy of this.strategies) {
      const currentPool = nodes.filter((n) => unassigned.has(n.id));
      const selected = strategy.select(currentPool, totalLayers);

      for (const node of selected) {
        result.set(node.id, strategy.type);
        unassigned.delete(node.id);
      }
    }

    for (const id of unassigned) {
      result.set(id, NodeType.Empty);
    }

    return result;
  }
}
