import type { NodeType } from '@/domain/models/navigation/node-type';
import type { NavigationConstraints } from '@/domain/models/navigation/route/route-graph-utils';
import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/**
 * Aggregate root for the navigable route graph.
 *
 * Owns all mutations to node traversal state (scanned, visited, current position).
 * The topology (nodes, connections, bounding box) is set once at generation time
 * and treated as read-only afterwards.
 *
 * Provides query methods to access graph topology (nodes by type, nodes by stop).
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

  /**
   * Returns true when a legal navigation path exists from current node to target.
   * Constraints can limit hop count, reveal requirements, and revisits.
   */
  canNavigateTo(targetId: string, constraints?: NavigationConstraints): boolean;

  /**
   * Finds the shortest legal path from current node to target.
   * Returns node ids in traversal order, including start and target.
   * Returns empty array when no legal path exists.
   */
  findPathTo(targetId: string, constraints?: NavigationConstraints): readonly string[];

  /**
   * Returns all node ids reachable from current node under the provided constraints.
   */
  getReachableNodeIds(constraints?: NavigationConstraints): readonly string[];

  /**
   * Returns connection strength in [0, 1] for a directed edge.
   * Undefined when no direct connection exists.
   */
  getConnectionStrength(fromId: string, toId: string): number | undefined;

  /**
   * Query topology: returns all nodes of a given type.
   * @param nodeType The NodeType to filter by.
   * @returns Array of all nodes with the matching type.
   */
  getNodesByType(nodeType: NodeType): readonly RouteNode[];

  /**
   * Query topology: returns all nodes at a given stop.
   * @param stopIndex The stop index (0 = start, 1..N-1 = intermediate, N = end).
   * @returns Array of all nodes at that stop, or empty if stop not found.
   */
  getNodesInStop(stopIndex: number): readonly RouteNode[];

  /**
   * Query topology: returns a node by its ID.
   * @param id The node ID.
   * @returns The node if found, or undefined if not found.
   */
  getNodeById(id: string): RouteNode | undefined;
}
