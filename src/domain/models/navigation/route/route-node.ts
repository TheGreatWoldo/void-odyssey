import { NodeType } from '@/domain/models/navigation/node-type';

export interface RouteNode {
  id: string;
  /** Index of the stop this node belongs to: 0 = start, 1..steps = intermediate, steps+1 = end */
  stopIndex: number;
  /** World position in pixels, centred at the world origin. */
  wx: number;
  wy: number;
  /** Pre-jitter position in world pixels — used for debug visualisation. */
  baseWx: number;
  baseWy: number;
  type: NodeType;
}

export interface RouteStop {
  /** Stop index: 0 = start, 1..steps = intermediate, steps+1 = end */
  index: number;
  /** Nodes at this stop */
  nodes: RouteNode[];
}

export interface RouteConnection {
  fromId: string;
  toId: string;
  /**
   * Directed edge strength in [0, 1]. Higher means easier/faster traversal.
   * Defaults to 1 when omitted.
   */
  strength?: number;
}

export interface GraphBoundingBox {
  /** World pixels, centred at origin. */
  minWx: number;
  minWy: number;
  maxWx: number;
  maxWy: number;
  /** Extent in world pixels. */
  width: number;
  height: number;
}

export interface RouteGraph {
  stops: RouteStop[];
  connections: RouteConnection[];
  /** Total number of stops (stops.length) — provided for convenience */
  totalStops: number;
  /** Axis-aligned bounding box of all node positions in world pixels */
  boundingBox: GraphBoundingBox;
}
