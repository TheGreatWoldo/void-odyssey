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

    expect(graph.nodes).toHaveLength(2);
    expect(graph.totalLayers).toBe(2);
  });

  it('first node type is Start and last is End', () => {
    const graph = generateRouteGraph(2, 1, 2, positionStrategy);

    expect(graph.nodes[0].type).toBe(NodeType.Start);
    expect(graph.nodes[graph.nodes.length - 1].type).toBe(NodeType.End);
  });

  it('intermediate node count is within minBranches and maxBranches per layer', () => {
    const steps = 3;
    const min = 2;
    const max = 4;
    const graph = generateRouteGraph(steps, min, max, positionStrategy);
    const byLayer = new Map<number, number>();

    for (const node of graph.nodes) {
      if (node.layer === 0 || node.layer === graph.totalLayers - 1) continue;
      byLayer.set(node.layer, (byLayer.get(node.layer) ?? 0) + 1);
    }

    for (const [, count] of byLayer) {
      expect(count).toBeGreaterThanOrEqual(min);
      expect(count).toBeLessThanOrEqual(max);
    }
  });

  it('total layers equals routeSteps + 2', () => {
    for (const steps of [0, 1, 3, 5]) {
      const graph = generateRouteGraph(steps, 1, 1, positionStrategy);

      expect(graph.totalLayers).toBe(steps + 2);
    }
  });

  it('every connection references valid node ids', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);
    const ids = new Set(graph.nodes.map((n) => n.id));

    for (const conn of graph.connections) {
      expect(ids.has(conn.fromId)).toBe(true);
      expect(ids.has(conn.toId)).toBe(true);
    }
  });

  it('connections go from lower to higher layer', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);
    const layerById = new Map(graph.nodes.map((n) => [n.id, n.layer]));

    for (const conn of graph.connections) {
      expect(layerById.get(conn.fromId)!).toBeLessThan(layerById.get(conn.toId)!);
    }
  });

  it('each node id is unique', () => {
    const graph = generateRouteGraph(4, 2, 4, positionStrategy);
    const ids = graph.nodes.map((n) => n.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('bounding box covers all nodes', () => {
    const graph = generateRouteGraph(3, 2, 3, positionStrategy);

    for (const node of graph.nodes) {
      expect(node.wx).toBeGreaterThanOrEqual(graph.boundingBox.minWx);
      expect(node.wx).toBeLessThanOrEqual(graph.boundingBox.maxWx);
      expect(node.wy).toBeGreaterThanOrEqual(graph.boundingBox.minWy);
      expect(node.wy).toBeLessThanOrEqual(graph.boundingBox.maxWy);
    }
  });

  it('clamps routeSteps to 0 when negative', () => {
    const graph = generateRouteGraph(-5, 1, 1, positionStrategy);

    expect(graph.totalLayers).toBe(2);
    expect(graph.nodes).toHaveLength(2);
  });

  it('clamps minBranches to 1 when zero', () => {
    const graph = generateRouteGraph(2, 0, 3, positionStrategy);
    const byLayer = new Map<number, number>();

    for (const node of graph.nodes) {
      if (node.layer === 0 || node.layer === graph.totalLayers - 1) continue;
      byLayer.set(node.layer, (byLayer.get(node.layer) ?? 0) + 1);
    }

    for (const [, count] of byLayer) {
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });
});
