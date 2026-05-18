import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/**
 * Port: what route-navigation actors need to read/write from application state.
 *
 * Defined in the domain layer so both infrastructure actors (importers) and the
 * application adapter (implementor) depend only on domain — neither layer needs
 * to see the other.
 */
export interface IRouteActorState {
  /** Current layers ahead the scanner can reveal. 0 = no auto-scan. */
  getScannerRange(): number;

  /** When true, all node types are revealed regardless of scanner range. */
  getRevealAllNodes(): boolean;

  /** Set the node currently under the pointer, and whether it's revealed by scanners. */
  setHovered(node: RouteNode | null, revealed?: boolean): void;

  /** Mark a node as scanned (revealed by scanner range). Idempotent. */
  markNodeScanned(id: string): void;

  /** Mark a node as visited by the ship. Idempotent. */
  markNodeVisited(id: string): void;

  /** Check if a node has been scanned. */
  isNodeScanned(id: string): boolean;

  /** Check if a node has been visited. */
  isNodeVisited(id: string): boolean;

  /** Returns the current route generation parameters. */
  getRouteParams(): {
    routeSteps: number;
    minBranches: number;
    maxBranches: number;
    routeSeed: string;
  };

  /** Returns true when the debug draw overlay is enabled. */
  isDrawDebugEnabled(): boolean;

  /** Selected route slot index in the route picker scene. */
  getSelectedRouteIndex(): number;

  /** Persists selected route slot index in the route picker scene. */
  setSelectedRouteIndex(index: number): void;

  /** When true, route picker scrolling is disabled and camera stays on selected route. */
  isRouteSelectionLocked(): boolean;

  /** Incrementing token indicating a requested route reroll. */
  getRouteRerollNonce(): number;

  /** Target route slot index for reroll, when requested. */
  getRerollRouteIndex(): number | null;
}
