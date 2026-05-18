import { describe, expect, it } from 'vitest';

import { NodeType } from '@/domain/models/navigation/node-type';
import type { NodePositionContext } from '@/domain/models/navigation/route/node-position-strategy';
import { generateRouteGraph } from '@/domain/services/route-graph-generator';

class FixedPositionStrategy {
  getPosition({ layer, indexInLayer }: NodePositionContext) {
    return {
      wx: layer * 100,
      wy: indexInLayer * 100,
      baseWx: layer * 100,
      baseWy: indexInLayer * 100,
    };
  }
}

const positionStrategy = new FixedPositionStrategy();

describe('generateRouteGraph', () => {
  it('produces exactly 2 nodes when routeSteps=0', () => {
    const graph = generateRouteGraph(0, 1, 1, positionStrategy);

    const allNodes = graph.stops.flatMap(s => s.nodes);
    expect(allNodes).toHaveLength(2);
    expect(graph.totalStops).toBe(2);
  });

  it('first node type is Start and last is End', () => {
    const graph = generateRouteGraph(2, 1, 2, positionStrategy);

    const allNodes = graph.stops.flatMap(s => s.nodes);
    expect(allNodes[0].type).toBe(NodeType.Start);
    expect(allNodes[allNodes.length - 1].type).toBe(NodeType.End);
  });

  it('intermediate node count is within minBranches and maxBranches per stop', () => {
    const steps = 3;
    const min = 2;
    const max = 4;
    const graph = generateRouteGraph(steps, min, max, positionStrategy);

    for (let stopIdx = 1; stopIdx < graph.stops.length - 1; stopIdx++) {
      const count = graph.stops[stopIdx].nodes.length;
      expect(count).toBeGreaterThanOrEqual(min);
      expect(count).toBeLessThanOrEqual(max);
    }
  });

  it('total stops equals routeSteps + 2', () => {
    for (const steps of [0, 1, 3, 5]) {
      const graph = generateRouteGraph(steps, 1, 1, positionStrategy);

      expect(graph.totalStops).toBe(steps + 2);
    }
  });

  it('every connection references valid node ids', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);
    const allNodes = graph.stops.flatMap(s => s.nodes);
    const ids = new Set(allNodes.map((n) => n.id));

    for (const conn of graph.connections) {
      expect(ids.has(conn.fromId)).toBe(true);
      expect(ids.has(conn.toId)).toBe(true);
    }
  });

  it('connections go from lower to higher stop index', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);
    const stopIdxById = new Map<string, number>();
    for (let stopIdx = 0; stopIdx < graph.stops.length; stopIdx++) {
      for (const node of graph.stops[stopIdx].nodes) {
        stopIdxById.set(node.id, stopIdx);
      }
    }

    for (const conn of graph.connections) {
      expect(stopIdxById.get(conn.fromId)!).toBeLessThan(stopIdxById.get(conn.toId)!);
    }
  });

  it('each node id is unique', () => {
    const graph = generateRouteGraph(4, 2, 4, positionStrategy);
    const allNodes = graph.stops.flatMap(s => s.nodes);
    const ids = allNodes.map((n) => n.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('bounding box covers all nodes', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);
    const allNodes = graph.stops.flatMap(s => s.nodes);

    for (const node of allNodes) {
      expect(node.wx).toBeGreaterThanOrEqual(graph.boundingBox.minWx);
      expect(node.wx).toBeLessThanOrEqual(graph.boundingBox.maxWx);
      expect(node.wy).toBeGreaterThanOrEqual(graph.boundingBox.minWy);
      expect(node.wy).toBeLessThanOrEqual(graph.boundingBox.maxWy);
    }
  });

  it('clamps routeSteps to 0 when negative', () => {
    const graph = generateRouteGraph(-5, 1, 1, positionStrategy);

    expect(graph.totalStops).toBe(2);
    const allNodes = graph.stops.flatMap(s => s.nodes);
    expect(allNodes).toHaveLength(2);
  });

  it('clamps minBranches to 1 when zero', () => {
    const graph = generateRouteGraph(2, 0, 3, positionStrategy);

    for (let stopIdx = 1; stopIdx < graph.stops.length - 1; stopIdx++) {
      const count = graph.stops[stopIdx].nodes.length;
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  it('is reproducible when a seed is provided', () => {
    const graphA = generateRouteGraph(3, 2, 4, positionStrategy, undefined, undefined, undefined, {
      seed: 'alpha-seed',
    });
    const graphB = generateRouteGraph(3, 2, 4, positionStrategy, undefined, undefined, undefined, {
      seed: 'alpha-seed',
    });

    expect(graphA.stops).toEqual(graphB.stops);
    expect(graphA.connections).toEqual(graphB.connections);
  });

  it('produces different topology for different seeds', () => {
    const graphA = generateRouteGraph(3, 2, 4, positionStrategy, undefined, undefined, undefined, {
      seed: 'seed-A',
    });
    const graphB = generateRouteGraph(3, 2, 4, positionStrategy, undefined, undefined, undefined, {
      seed: 'seed-B',
    });

    expect(graphA.stops).not.toEqual(graphB.stops);
  });

  it('assigns normalized connection strength to all generated edges', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);

    for (const connection of graph.connections) {
      expect(connection.strength).toBeDefined();
      expect(connection.strength!).toBeGreaterThan(0);
      expect(connection.strength!).toBeLessThanOrEqual(1);
    }
  });
});
