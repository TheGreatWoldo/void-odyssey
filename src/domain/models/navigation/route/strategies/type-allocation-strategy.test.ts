import { describe, expect, it } from 'vitest';

import { NodeType } from '@/domain/models/navigation/node-type';
import type { PositionedNodeStub } from '@/domain/models/navigation/route/strategies/node-type-strategy';
import {
    AbsoluteTypeAllocation,
    ProbabilisticTypeAllocation,
} from '@/domain/models/navigation/route/strategies/type-allocation-strategy';

function makeNode(id: string, stopIndex: number): PositionedNodeStub {
  return { id, stopIndex, wx: 0, wy: 0, baseWx: 0, baseWy: 0 };
}

// ---------------------------------------------------------------------------
// AbsoluteTypeAllocation
// ---------------------------------------------------------------------------

describe('AbsoluteTypeAllocation', () => {

  it('selects exactly max nodes when the pool is large enough', () => {
    const strategy = new AbsoluteTypeAllocation({ type: NodeType.Shipyard, min: 1, max: 2 });
    const nodes = [makeNode('a', 1), makeNode('b', 2), makeNode('c', 3)];

    const selected = strategy.select(nodes, 10);

    expect(selected.length).toBeLessThanOrEqual(2);
    expect(selected.length).toBeGreaterThanOrEqual(1);
  });

  it('selects fewer than max when pool is smaller', () => {
    const strategy = new AbsoluteTypeAllocation({ type: NodeType.Store, min: 0, max: 5 });
    const nodes = [makeNode('a', 1), makeNode('b', 2)];

    const selected = strategy.select(nodes, 10);

    expect(selected.length).toBeLessThanOrEqual(2);
  });

  it('honours min guarantee even when spacing constraint would prevent it', () => {
    // With minLayerSpacing=5 and two nodes on layers 1 and 2, only one passes
    // the spacing check but min=2 forces both to be selected.
    const strategy = new AbsoluteTypeAllocation({
      type: NodeType.Relic,
      min: 2,
      max: 2,
      minLayerSpacing: 5,
    });
    const nodes = [makeNode('a', 1), makeNode('b', 2)];

    const selected = strategy.select(nodes, 10);

    expect(selected.length).toBe(2);
  });

  it('respects the eligibleStopIndex filter', () => {
    const strategy = new AbsoluteTypeAllocation({
      type: NodeType.Combat,
      min: 0,
      max: 10,
      eligibleStopIndex: (s) => s === 3,
    });
    const nodes = [makeNode('a', 1), makeNode('b', 2), makeNode('c', 3)];

    const selected = strategy.select(nodes, 10);

    expect(selected.every((n) => n.stopIndex === 3)).toBe(true);
  });

  it('returns only nodes that are subsets of the input', () => {
    const strategy = new AbsoluteTypeAllocation({ type: NodeType.Event, min: 1, max: 3 });
    const nodes = [makeNode('x', 2), makeNode('y', 4)];
    const ids = new Set(nodes.map((n) => n.id));

    const selected = strategy.select(nodes, 10);

    expect(selected.every((n) => ids.has(n.id))).toBe(true);
  });

  it('returns empty array when pool is empty', () => {
    const strategy = new AbsoluteTypeAllocation({ type: NodeType.Shipyard, min: 0, max: 3 });

    expect(strategy.select([], 10)).toHaveLength(0);
  });

  it('has the correct node type', () => {
    const strategy = new AbsoluteTypeAllocation({ type: NodeType.HiddenCache, min: 1, max: 1 });

    expect(strategy.type).toBe(NodeType.HiddenCache);
  });

});

// ---------------------------------------------------------------------------
// ProbabilisticTypeAllocation
// ---------------------------------------------------------------------------

describe('ProbabilisticTypeAllocation', () => {

  it('selects no nodes with chance=0', () => {
    const strategy = new ProbabilisticTypeAllocation({ type: NodeType.Event, chance: 0 });
    const nodes = [makeNode('a', 1), makeNode('b', 2), makeNode('c', 3)];

    expect(strategy.select(nodes, 10)).toHaveLength(0);
  });

  it('selects all eligible nodes with chance=1', () => {
    const strategy = new ProbabilisticTypeAllocation({ type: NodeType.Combat, chance: 1 });
    const nodes = [makeNode('a', 1), makeNode('b', 2), makeNode('c', 3)];

    expect(strategy.select(nodes, 10)).toHaveLength(3);
  });

  it('respects the eligibleStopIndex filter', () => {
    const strategy = new ProbabilisticTypeAllocation({
      type: NodeType.Store,
      chance: 1,
      eligibleStopIndex: (s) => s >= 3,
    });
    const nodes = [makeNode('a', 1), makeNode('b', 2), makeNode('c', 3), makeNode('d', 4)];

    const selected = strategy.select(nodes, 10);

    expect(selected.every((n) => n.stopIndex >= 3)).toBe(true);
  });

  it('has the correct node type', () => {
    const strategy = new ProbabilisticTypeAllocation({ type: NodeType.Relic, chance: 0.5 });

    expect(strategy.type).toBe(NodeType.Relic);
  });

  it('returns empty array when pool is empty', () => {
    const strategy = new ProbabilisticTypeAllocation({ type: NodeType.Event, chance: 1 });

    expect(strategy.select([], 10)).toHaveLength(0);
  });

});
