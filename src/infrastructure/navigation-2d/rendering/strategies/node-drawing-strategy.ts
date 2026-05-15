import type { NodeType } from '@/domain/models/navigation/node-type';
import type { Canvas } from 'excalibur';

/**
 * Visual presentation state of a route node.
 *
 * - `Unknown`   — not reachable from current position; no type information shown.
 * - `Known`     — directly navigatable but type is hidden (no scanner).
 * - `Reachable` — directly navigatable; type hidden unless `scanned` is true.
 * - `Current`   — the node the player's ship currently occupies.
 * - `Past`      — behind the current node; shown in a muted colour.
 *
 * Whether the node's type is revealed is a separate `scanned` boolean passed to
 * `getGraphic` rather than a dedicated state value.
 */
export const NodeVisualState = {
  Unknown: 'unknown',
  Known: 'known',
  Reachable: 'reachable',
  Current: 'current',
  Past: 'past',
} as const;

export type NodeVisualState =
  (typeof NodeVisualState)[keyof typeof NodeVisualState];

export interface NodeDrawingStrategy {
  /** Returns the Excalibur Canvas graphic for a node of the given type and visual state.
   *  `scanned` – when true the node's type colour and icon are revealed. */
  getGraphic(type: NodeType, state: NodeVisualState, scanned: boolean): Canvas;
  /** Optional one-time asset loading called before the strategy is first used. */
  preload?(): Promise<void>;
}
