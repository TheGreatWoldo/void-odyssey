import { NodeType } from '@/domain/navigation/node-type';

export interface RouteNode {
  id: string;
  /** Layer index: 0 = start, 1..steps = intermediate, steps+1 = end */
  layer: number;
  /** Index within the layer */
  indexInLayer: number;
  /** World position in pixels, centred at the world origin. */
  wx: number;
  wy: number;
  /** Pre-jitter position in world pixels — used for debug visualisation. */
  baseWx: number;
  baseWy: number;
  type: NodeType;
  label: string;
  description: string;
}

export interface RouteConnection {
  fromId: string;
  toId: string;
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
  nodes: RouteNode[];
  connections: RouteConnection[];
  /** Total number of layers including start and end */
  totalLayers: number;
  /** Axis-aligned bounding box of all node positions in world pixels */
  boundingBox: GraphBoundingBox;
}
