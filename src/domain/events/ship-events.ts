import type { ShipState } from '@/domain/models/ship/ship-state';
import type { DomainEvent } from '@/shared/domain-event';

export interface ShipStateChangedEvent extends DomainEvent {
  readonly type: 'ShipStateChanged';
  readonly shipId: string;
  readonly fromState: ShipState;
  readonly toState: ShipState;
}

export interface ShipDamagedEvent extends DomainEvent {
  readonly type: 'ShipDamaged';
  readonly shipId: string;
  readonly damageAmount: number;
  readonly hullRemaining: number;
  readonly maxHull: number;
}

export interface ShipDestroyedEvent extends DomainEvent {
  readonly type: 'ShipDestroyed';
  readonly shipId: string;
  readonly shipName: string;
}

export interface ShipHullRepairedEvent extends DomainEvent {
  readonly type: 'ShipHullRepaired';
  readonly shipId: string;
  readonly amountRestored: number;
  readonly currentHull: number;
}

export type ShipEvent =
  | ShipStateChangedEvent
  | ShipDamagedEvent
  | ShipDestroyedEvent
  | ShipHullRepairedEvent;
