import { NodeType } from '@/domain/models/navigation/node-type';

export type RGB = [number, number, number];

export const ENDPOINT_RGB: RGB = [220, 90, 30];
export const NORMAL_RGB: RGB = [100, 180, 255];
export const REACHABLE_RGB: RGB = [200, 210, 230];
export const CURRENT_RGB: RGB = [170, 130, 0];

/**
 * Mild size modifier per node type, loosely based on the spectral-class rule:
 * blue/hot stars are larger, red/cool stars are smaller.
 */
export const NODE_TYPE_SIZE_FACTOR: Record<NodeType, number> = {
  [NodeType.Start]: 1.0,
  [NodeType.End]: 1.0,
  [NodeType.Combat]: 0.85,
  [NodeType.Store]: 0.92,
  [NodeType.Relic]: 0.95,
  [NodeType.Empty]: 1.05,
  [NodeType.HiddenCache]: 0.9,
  [NodeType.Shipyard]: 1.15,
  [NodeType.Event]: 1.0,
};

/** Per-type colour used when a node's type is revealed (visited or scanned). */
export const REVEALED_RGB_BY_TYPE: Record<NodeType, RGB> = {
  [NodeType.Start]: [220, 90, 30],
  [NodeType.End]: [220, 90, 30],
  [NodeType.Combat]: [220, 40, 60],
  [NodeType.Store]: [180, 120, 0],
  [NodeType.Relic]: [190, 40, 130],
  [NodeType.Empty]: [0, 160, 95],
  [NodeType.HiddenCache]: [140, 200, 20],
  [NodeType.Shipyard]: [0, 150, 200],
  [NodeType.Event]: [160, 70, 220],
};
