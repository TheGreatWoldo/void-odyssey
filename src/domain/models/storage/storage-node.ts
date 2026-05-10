/**
 * Common interface implemented by both ResourceContainer and ItemContainer.
 * Provides enough surface for ContainerQuery to traverse and account for
 * capacity across heterogeneous container trees.
 */
export interface IStorageNode {
  readonly id: string;
  readonly kind: 'resource' | 'item';
  readonly capacity: number;
  freeSpace(): number;
  getStorageNodes(): readonly IStorageNode[];
}
