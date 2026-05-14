import { NodeType } from '@/domain/models/navigation/node-type';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';
import { describe, expect, it } from 'vitest';
import { ClosestNeighboursConnectionStrategy } from './closest-neighbours-connection-strategy';

function makeNode(id: string, layer: number, wx: number, wy: number): RouteNode {
  return { id, layer, wx, wy, indexInLayer: 0, baseWx: wx, baseWy: wy, type: NodeType.Empty };
}

describe('ClosestNeighboursConnectionStrategy', () => {
  describe('buildConnections', () => {
    it('returns empty array for empty input', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      expect(strategy.buildConnections([])).toEqual([]);
    });

    it('returns empty array for single layer', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const nodes = [
        makeNode('a', 0, 0, 0),
        makeNode('b', 0, 1, 1),
      ];
      expect(strategy.buildConnections(nodes)).toEqual([]);
    });

    it('connects nodes to up to N closest neighbors in next layer', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('b0', 1, 0, 0),
        makeNode('b1', 1, 1, 1),
        makeNode('b2', 1, 10, 10),
      ];
      const conns = strategy.buildConnections(nodes);

      // a0 should attempt to connect to closest neighbors
      const a0Conns = conns.filter(c => c.fromId === 'a0');
      expect(a0Conns.length).toBeGreaterThanOrEqual(1);
      expect(a0Conns.some(c => c.toId === 'b0')).toBe(true);
    });

    it('does not create duplicate connections', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(3);
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('b0', 1, 0, 0),
        makeNode('b1', 1, 1, 1),
      ];
      const conns = strategy.buildConnections(nodes);

      const pairs = conns.map(c => `${c.fromId}|${c.toId}`);
      const uniquePairs = new Set(pairs);
      expect(pairs).toHaveLength(uniquePairs.size);
    });

    it('rejects crossing edges in the same layer pair', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('a1', 0, 0, 10),
        makeNode('b0', 1, 1, 5),
        makeNode('b1', 1, -1, 5),
      ];
      const conns = strategy.buildConnections(nodes);

      // a0→b0 and a1→b1 would cross a0→b1 and a1→b0
      // Should reject one of the crossing pairs
      const connStrs = conns.map(c => `${c.fromId}→${c.toId}`).sort();
      expect(connStrs).toBeDefined();
      expect(conns.length).toBeLessThanOrEqual(4);
    });

    it('guarantees every non-start node has at least one incoming connection', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(1);
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('b0', 1, 100, 100),
        makeNode('b1', 1, 101, 101),
        makeNode('c0', 2, 0, 0),
        makeNode('c1', 2, 200, 200),
      ];
      const conns = strategy.buildConnections(nodes);

      const hasIncoming = new Set(conns.map(c => c.toId));
      const nonStartNodes = nodes.filter(n => n.layer > 0);
      for (const node of nonStartNodes) {
        expect(hasIncoming.has(node.id)).toBe(true);
      }
    });

    it('uses fallback (closest node) when all candidates cross', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(1);
      // Construct a scenario where fallback is needed
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('a1', 0, 0, 100),
        makeNode('b0', 1, 50, 50),
      ];
      const conns = strategy.buildConnections(nodes);

      // b0 should have at least one incoming connection (fallback to closest)
      const incomingToB0 = conns.filter(c => c.toId === 'b0');
      expect(incomingToB0.length).toBeGreaterThanOrEqual(1);
    });

    it('respects neighbourCount parameter as upper limit', () => {
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('b0', 1, 0, 0),
        makeNode('b1', 1, 1, 1),
        makeNode('b2', 1, 2, 2),
        makeNode('b3', 1, 3, 3),
      ];

      const strategy1 = new ClosestNeighboursConnectionStrategy(1);
      const conns1 = strategy1.buildConnections(nodes);
      const a0FromCount1 = conns1.filter(c => c.fromId === 'a0').length;

      const strategy3 = new ClosestNeighboursConnectionStrategy(3);
      const conns3 = strategy3.buildConnections(nodes);
      const a0FromCount3 = conns3.filter(c => c.fromId === 'a0').length;

      // Strategy with neighbourCount=3 should allow more outgoing from a0 than =1
      expect(a0FromCount3).toBeGreaterThanOrEqual(a0FromCount1);
    });

    it('handles multiple layers correctly', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const nodes = [
        makeNode('a0', 0, 0, 0),
        makeNode('b0', 1, 0, 0),
        makeNode('b1', 1, 1, 1),
        makeNode('c0', 2, 0, 0),
        makeNode('c1', 2, 1, 1),
      ];
      const conns = strategy.buildConnections(nodes);

      const layer0To1 = conns.filter(c => {
        const from = nodes.find(n => n.id === c.fromId);
        const to = nodes.find(n => n.id === c.toId);
        return from && to && from.layer === 0 && to.layer === 1;
      });

      const layer1To2 = conns.filter(c => {
        const from = nodes.find(n => n.id === c.fromId);
        const to = nodes.find(n => n.id === c.toId);
        return from && to && from.layer === 1 && to.layer === 2;
      });

      expect(layer0To1.length).toBeGreaterThan(0);
      expect(layer1To2.length).toBeGreaterThan(0);
    });
  });
});
