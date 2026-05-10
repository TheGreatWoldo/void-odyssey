import { RouteNode } from '@/domain/navigation/route/route-node';

/**
 * Aggregate root for the navigable route graph.
 *
 * Owns all mutations to node traversal state (scanned, visited, current position).
 * The topology (nodes, connections, bounding box) is set once at generation time
 * and treated as read-only afterwards.
 *
 * Implementations live in the infrastructure layer (e.g. backed by Zustand).
 */
export interface RouteGraphAggregate {
  /** The node the ship is currently orbiting. Null = not yet placed (start node). */
  getCurrentNode(): RouteNode | null;

  /** Mark a node as having been revealed by scanner range. Idempotent. */
  markNodeScanned(id: string): void;

  /**
   * Mark a node as visited by the ship.
   * No-op if the node has not been scanned first — a node cannot be visited
   * without being revealed.
   * Idempotent once scanned.
   */
  markNodeVisited(id: string): void;

  /** Returns true if the node has been revealed by scanners. */
  isNodeScanned(id: string): boolean;
}
