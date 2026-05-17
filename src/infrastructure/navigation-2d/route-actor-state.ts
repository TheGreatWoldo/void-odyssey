import type { RouteNode } from '@/domain/models/navigation/route/route-node';

/**
 * Port: what route-navigation actors need to read/write from application state.
 *
 * This abstraction allows infrastructure (Excalibur actors) to interact with
 * application-layer state without directly importing Zustand stores or other
 * application types. The application layer provides an adapter that implements
 * this interface.
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
}
