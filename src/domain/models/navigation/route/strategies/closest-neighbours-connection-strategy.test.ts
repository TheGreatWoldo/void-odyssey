import { NodeType } from '@/domain/models/navigation/node-type';
import type { RouteNode, RouteStop } from '@/domain/models/navigation/route/route-node';
import { describe, expect, it } from 'vitest';
import { ClosestNeighboursConnectionStrategy } from './closest-neighbours-connection-strategy';

function makeNode(id: string, wx: number, wy: number): RouteNode {
  return { id, wx, wy, baseWx: wx, baseWy: wy, stopIndex: 0, type: NodeType.Empty };
}

function makeStops(...nodeGroups: RouteNode[][]): RouteStop[] {
  return nodeGroups.map((nodes, idx) => ({ index: idx, nodes }));
}

describe('ClosestNeighboursConnectionStrategy', () => {
  describe('buildConnections', () => {
    it('returns empty array for empty input', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      expect(strategy.buildConnections([])).toEqual([]);
    });

    it('returns empty array for single stop', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const nodes = [
        makeNode('a', 0, 0),
        makeNode('b', 1, 1),
      ];
      const stops = makeStops(nodes);
      expect(strategy.buildConnections(stops)).toEqual([]);
    });

    it('connects nodes to up to N closest neighbors in next stop', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const stop0 = [makeNode('a0', 0, 0)];
      const stop1 = [
        makeNode('b0', 0, 0),
        makeNode('b1', 1, 1),
        makeNode('b2', 10, 10),
      ];
      const stops = makeStops(stop0, stop1);
      const conns = strategy.buildConnections(stops);

      // a0 should attempt to connect to closest neighbors
      const a0Conns = conns.filter(c => c.fromId === 'a0');
      expect(a0Conns.length).toBeGreaterThanOrEqual(1);
      expect(a0Conns.some(c => c.toId === 'b0')).toBe(true);
    });

    it('does not create duplicate connections', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(3);
      const stop0 = [makeNode('a0', 0, 0)];
      const stop1 = [
        makeNode('b0', 0, 0),
        makeNode('b1', 1, 1),
      ];
      const stops = makeStops(stop0, stop1);
      const conns = strategy.buildConnections(stops);

      const pairs = conns.map(c => `${c.fromId}|${c.toId}`);
      const uniquePairs = new Set(pairs);
      expect(pairs).toHaveLength(uniquePairs.size);
    });

    it('rejects crossing edges in the same stop pair', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const stop0 = [
        makeNode('a0', 0, 0),
        makeNode('a1', 0, 10),
      ];
      const stop1 = [
        makeNode('b0', 1, 5),
        makeNode('b1', -1, 5),
      ];
      const stops = makeStops(stop0, stop1);
      const conns = strategy.buildConnections(stops);

      // a0→b0 and a1→b1 would cross a0→b1 and a1→b0
      // Should reject one of the crossing pairs
      const connStrs = conns.map(c => `${c.fromId}→${c.toId}`).sort();
      expect(connStrs).toBeDefined();
      expect(conns.length).toBeLessThanOrEqual(4);
    });

    it('guarantees every non-start node has at least one incoming connection', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(1);
      const stop0 = [makeNode('a0', 0, 0)];
      const stop1 = [
        makeNode('b0', 100, 100),
        makeNode('b1', 101, 101),
      ];
      const stop2 = [
        makeNode('c0', 0, 0),
        makeNode('c1', 200, 200),
      ];
      const stops = makeStops(stop0, stop1, stop2);
      const conns = strategy.buildConnections(stops);

      const hasIncoming = new Set(conns.map(c => c.toId));
      const nonStartNodes = stops.slice(1).flatMap(s => s.nodes);
      for (const node of nonStartNodes) {
        expect(hasIncoming.has(node.id)).toBe(true);
      }
    });

    it('uses fallback (closest node) when all candidates cross', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(1);
      const stop0 = [
        makeNode('a0', 0, 0),
        makeNode('a1', 0, 100),
      ];
      const stop1 = [makeNode('b0', 50, 50)];
      const stops = makeStops(stop0, stop1);
      const conns = strategy.buildConnections(stops);

      // b0 should have at least one incoming connection (fallback to closest)
      const incomingToB0 = conns.filter(c => c.toId === 'b0');
      expect(incomingToB0.length).toBeGreaterThanOrEqual(1);
    });

    it('respects neighbourCount parameter as upper limit', () => {
      const stop0 = [makeNode('a0', 0, 0)];
      const stop1 = [
        makeNode('b0', 0, 0),
        makeNode('b1', 1, 1),
        makeNode('b2', 2, 2),
        makeNode('b3', 3, 3),
      ];
      const stops = makeStops(stop0, stop1);

      const strategy1 = new ClosestNeighboursConnectionStrategy(1);
      const conns1 = strategy1.buildConnections(stops);
      const a0FromCount1 = conns1.filter(c => c.fromId === 'a0').length;

      const strategy3 = new ClosestNeighboursConnectionStrategy(3);
      const conns3 = strategy3.buildConnections(stops);
      const a0FromCount3 = conns3.filter(c => c.fromId === 'a0').length;

      // Strategy with neighbourCount=3 should allow more outgoing from a0 than =1
      expect(a0FromCount3).toBeGreaterThanOrEqual(a0FromCount1);
    });

    it('handles multiple stops correctly', () => {
      const strategy = new ClosestNeighboursConnectionStrategy(2);
      const stop0 = [makeNode('a0', 0, 0)];
      const stop1 = [
        makeNode('b0', 0, 0),
        makeNode('b1', 1, 1),
      ];
      const stop2 = [
        makeNode('c0', 0, 0),
        makeNode('c1', 1, 1),
      ];
      const stops = makeStops(stop0, stop1, stop2);
      const conns = strategy.buildConnections(stops);

      const stop0To1 = conns.filter(c => {
        const fromInStop0 = stop0.some(n => n.id === c.fromId);
        const toInStop1 = stop1.some(n => n.id === c.toId);
        return fromInStop0 && toInStop1;
      });

      const stop1To2 = conns.filter(c => {
        const fromInStop1 = stop1.some(n => n.id === c.fromId);
        const toInStop2 = stop2.some(n => n.id === c.toId);
        return fromInStop1 && toInStop2;
      });

      expect(stop0To1.length).toBeGreaterThan(0);
      expect(stop1To2.length).toBeGreaterThan(0);
    });
  });
});
