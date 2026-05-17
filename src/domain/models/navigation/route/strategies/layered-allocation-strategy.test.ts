import { describe, expect, it } from 'vitest';

import { NodeType } from '@/domain/models/navigation/node-type';
import { LayeredAllocationStrategy } from '@/domain/models/navigation/route/strategies/layered-allocation-strategy';
import type { PositionedNodeStub } from '@/domain/models/navigation/route/strategies/node-type-strategy';
import { AbsoluteTypeAllocation } from '@/domain/models/navigation/route/strategies/type-allocation-strategy';

function makeNode(id: string, stopIndex: number): PositionedNodeStub {
  return { id, stopIndex, wx: 0, wy: 0, baseWx: 0, baseWy: 0 };
}

describe('LayeredAllocationStrategy', () => {

  it('assigns Empty to all nodes when no strategies are provided', () => {
    const strategy = new LayeredAllocationStrategy([]);
    const nodes = [makeNode('a', 1), makeNode('b', 2)];

    const result = strategy.assignAll(nodes, 10);

    expect(result.get('a')).toBe(NodeType.Empty);
    expect(result.get('b')).toBe(NodeType.Empty);
  });

  it('assigns the correct type for claimed nodes', () => {
    const alloc = new AbsoluteTypeAllocation({ type: NodeType.Shipyard, min: 1, max: 1 });
    const strategy = new LayeredAllocationStrategy([alloc]);
    const nodes = [makeNode('a', 2), makeNode('b', 3)];

    const result = strategy.assignAll(nodes, 10);

    const types = [...result.values()];
    expect(types).toContain(NodeType.Shipyard);
  });

  it('remaining unallocated nodes default to Empty', () => {
    const alloc = new AbsoluteTypeAllocation({ type: NodeType.Shipyard, min: 1, max: 1 });
    const strategy = new LayeredAllocationStrategy([alloc]);
    const nodes = [makeNode('a', 2), makeNode('b', 3), makeNode('c', 4)];

    const result = strategy.assignAll(nodes, 10);

    const emptyCount = [...result.values()].filter((t) => t === NodeType.Empty).length;
    const shipyardCount = [...result.values()].filter((t) => t === NodeType.Shipyard).length;

    expect(shipyardCount).toBe(1);
    expect(emptyCount).toBe(nodes.length - 1);
  });

  it('earlier strategies have first pick — later strategies cannot steal already-allocated nodes', () => {
    // Strategy A claims all nodes; Strategy B should get nothing.
    const allocA = new AbsoluteTypeAllocation({ type: NodeType.Store, min: 3, max: 3 });
    const allocB = new AbsoluteTypeAllocation({ type: NodeType.Combat, min: 3, max: 3 });
    const strategy = new LayeredAllocationStrategy([allocA, allocB]);
    const nodes = [makeNode('a', 1), makeNode('b', 2), makeNode('c', 3)];

    const result = strategy.assignAll(nodes, 10);

    const storeCount = [...result.values()].filter((t) => t === NodeType.Store).length;
    const combatCount = [...result.values()].filter((t) => t === NodeType.Combat).length;

    expect(storeCount).toBe(3);
    expect(combatCount).toBe(0);
  });

  it('every node in the input appears in the output map', () => {
    const strategy = new LayeredAllocationStrategy([]);
    const nodes = [makeNode('x', 1), makeNode('y', 2), makeNode('z', 3)];

    const result = strategy.assignAll(nodes, 10);

    for (const node of nodes) {
      expect(result.has(node.id)).toBe(true);
    }
  });

  it('handles an empty node list', () => {
    const strategy = new LayeredAllocationStrategy([]);

    const result = strategy.assignAll([], 10);

    expect(result.size).toBe(0);
  });

  it('multiple strategies each claim their share', () => {
    const allocA = new AbsoluteTypeAllocation({ type: NodeType.Relic, min: 1, max: 1 });
    const allocB = new AbsoluteTypeAllocation({ type: NodeType.Event, min: 1, max: 1 });
    const strategy = new LayeredAllocationStrategy([allocA, allocB]);
    const nodes = [makeNode('a', 2), makeNode('b', 3), makeNode('c', 4)];

    const result = strategy.assignAll(nodes, 10);

    const types = [...result.values()];
    expect(types).toContain(NodeType.Relic);
    expect(types).toContain(NodeType.Event);
  });

});
