import { describe, expect, it } from 'vitest';

import {
    canNavigateTo,
    findShortestPath,
    getConnectionStrength,
    getReachableNodeIds,
    isForwardReachable,
} from '@/domain/models/navigation/route/route-graph-utils';
import type { RouteConnection } from '@/domain/models/navigation/route/route-node';

function conn(fromId: string, toId: string): RouteConnection {
  return { fromId, toId };
}

describe('isForwardReachable', () => {

  it('returns false when start is null', () => {
    expect(isForwardReachable(null, 'b', [conn('a', 'b')], 3)).toBe(false);
  });

  it('returns true when target is directly reachable in one hop', () => {
    const connections = [conn('a', 'b')];

    expect(isForwardReachable('a', 'b', connections, 1)).toBe(true);
  });

  it('returns true when target is reachable in multiple hops within step limit', () => {
    const connections = [conn('a', 'b'), conn('b', 'c'), conn('c', 'd')];

    expect(isForwardReachable('a', 'd', connections, 3)).toBe(true);
  });

  it('returns false when step limit is too small', () => {
    const connections = [conn('a', 'b'), conn('b', 'c'), conn('c', 'd')];

    // Need 3 hops but only 2 allowed
    expect(isForwardReachable('a', 'd', connections, 2)).toBe(false);
  });

  it('returns false when target is not in the graph at all', () => {
    const connections = [conn('a', 'b')];

    expect(isForwardReachable('a', 'z', connections, 10)).toBe(false);
  });

  it('returns false when no connections exist', () => {
    expect(isForwardReachable('a', 'b', [], 5)).toBe(false);
  });

  it('returns true when start === target within 1 step (start already in frontier)', () => {
    // The frontier starts with 'a'; 'a' is the target — reachable before any hop.
    expect(isForwardReachable('a', 'a', [], 1)).toBe(true);
  });

  it('does not traverse backwards — only follows fromId→toId', () => {
    // Connection goes b→a only; starting from a should not reach b
    const connections = [conn('b', 'a')];

    expect(isForwardReachable('a', 'b', connections, 3)).toBe(false);
  });

  it('handles branching paths', () => {
    const connections = [conn('root', 'left'), conn('root', 'right'), conn('left', 'leaf')];

    expect(isForwardReachable('root', 'leaf', connections, 2)).toBe(true);
    expect(isForwardReachable('root', 'right', connections, 1)).toBe(true);
  });

});

describe('findShortestPath', () => {
  it('returns shortest directed path when reachable', () => {
    const connections = [
      conn('a', 'b'),
      conn('b', 'd'),
      conn('a', 'c'),
      conn('c', 'e'),
      conn('e', 'd'),
    ];

    expect(findShortestPath('a', 'd', connections)).toEqual(['a', 'b', 'd']);
  });

  it('returns empty path when target is not scanned and scan constraint is provided', () => {
    const connections = [conn('a', 'b')];

    expect(
      findShortestPath('a', 'b', connections, { scannedNodeIds: ['a'] })
    ).toEqual([]);
  });

  it('respects maxHops constraint', () => {
    const connections = [conn('a', 'b'), conn('b', 'c')];

    expect(findShortestPath('a', 'c', connections, { maxHops: 1 })).toEqual([]);
  });

  it('respects no-revisit constraint', () => {
    const connections = [conn('a', 'b'), conn('a', 'c')];

    expect(
      findShortestPath('a', 'b', connections, {
        allowRevisit: false,
        visitedNodeIds: ['b'],
      })
    ).toEqual([]);
  });
});

describe('canNavigateTo', () => {
  it('returns true when path exists', () => {
    expect(canNavigateTo('a', 'c', [conn('a', 'b'), conn('b', 'c')])).toBe(true);
  });

  it('returns false when no path exists', () => {
    expect(canNavigateTo('a', 'z', [conn('a', 'b'), conn('b', 'c')])).toBe(false);
  });
});

describe('getReachableNodeIds', () => {
  it('returns all reachable nodes excluding start', () => {
    const connections = [conn('a', 'b'), conn('b', 'c'), conn('a', 'd')];

    const reachable = getReachableNodeIds('a', connections);

    expect(new Set(reachable)).toEqual(new Set(['b', 'c', 'd']));
  });

  it('respects max hops', () => {
    const connections = [conn('a', 'b'), conn('b', 'c')];

    expect(new Set(getReachableNodeIds('a', connections, { maxHops: 1 }))).toEqual(new Set(['b']));
  });
});

describe('getConnectionStrength', () => {
  it('returns explicit strength when present', () => {
    const connections: RouteConnection[] = [{ fromId: 'a', toId: 'b', strength: 0.75 }];

    expect(getConnectionStrength('a', 'b', connections)).toBeCloseTo(0.75);
  });

  it('defaults to 1 when strength is omitted', () => {
    const connections: RouteConnection[] = [{ fromId: 'a', toId: 'b' }];

    expect(getConnectionStrength('a', 'b', connections)).toBe(1);
  });

  it('returns undefined for missing edge', () => {
    const connections: RouteConnection[] = [{ fromId: 'a', toId: 'b' }];

    expect(getConnectionStrength('b', 'a', connections)).toBeUndefined();
  });
});
