import type { ResourceType } from './resource';

/**
 * Discriminated union of resource container operation failures.
 * Each error type specifies why the operation was rejected.
 */

export const ResourceContainerErrorKind = {
  Full: 'full',
  TypeNotAccepted: 'type-not-accepted',
  TypeCapExceeded: 'type-cap-exceeded',
} as const;

export type ResourceContainerErrorKind = (typeof ResourceContainerErrorKind)[keyof typeof ResourceContainerErrorKind];

export interface ResourceContainerFull {
  readonly kind: 'full';
  /** How many units could not be stored due to full capacity. */
  readonly refused: number;
}

export interface ResourceTypeNotAccepted {
  readonly kind: 'type-not-accepted';
  /** The resource type that was rejected. */
  readonly resourceType: ResourceType;
}

export interface ResourceTypeCapExceeded {
  readonly kind: 'type-cap-exceeded';
  /** The resource type that exceeded its per-type cap. */
  readonly resourceType: ResourceType;
  /** The per-type capacity limit. */
  readonly cap: number;
  /** Current amount already in the container. */
  readonly current: number;
  /** How many additional units could fit. */
  readonly available: number;
}

export type ResourceContainerError =
  | ResourceContainerFull
  | ResourceTypeNotAccepted
  | ResourceTypeCapExceeded;

/**
 * Discriminated union of item container operation failures.
 * Each error type specifies why the operation was rejected.
 */

export const ItemContainerErrorKind = {
  Full: 'full',
  TypeNotAccepted: 'type-not-accepted',
} as const;

export type ItemContainerErrorKind = (typeof ItemContainerErrorKind)[keyof typeof ItemContainerErrorKind];

export interface ItemContainerFull {
  readonly kind: 'full';
  /** The item slot cost that could not be accommodated. */
  readonly requestedSlots: number;
  /** How much free space was available. */
  readonly available: number;
}

export interface ItemTypeNotAccepted {
  readonly kind: 'type-not-accepted';
  /** The item type that was rejected. */
  readonly itemType: string;
}

export type ItemContainerError = ItemContainerFull | ItemTypeNotAccepted;
