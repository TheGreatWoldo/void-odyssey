import type { DomainEvent } from '@/shared/domain-event';

/**
 * Domain events raised by the PowerSystem.
 */

export interface PowerLowEvent extends DomainEvent {
  readonly type: 'PowerLow';
  readonly systemId: string;
  /** Current stored power (units) */
  readonly storedPower: number;
  /** Battery capacity threshold (units) */
  readonly threshold: number;
}

export interface PowerCriticalEvent extends DomainEvent {
  readonly type: 'PowerCritical';
  readonly systemId: string;
  /** Current stored power (units) */
  readonly storedPower: number;
  /** Critical threshold (units) */
  readonly criticalThreshold: number;
}

export interface BatteryAddedEvent extends DomainEvent {
  readonly type: 'BatteryAdded';
  readonly systemId: string;
  /** Capacity of the added battery (units) */
  readonly batteryCapacity: number;
  /** New total capacity after addition (units) */
  readonly totalCapacity: number;
}

export interface BatteryRemovedEvent extends DomainEvent {
  readonly type: 'BatteryRemoved';
  readonly systemId: string;
  /** Capacity of the removed battery (units) */
  readonly batteryCapacity: number;
  /** New total capacity after removal (units) */
  readonly totalCapacity: number;
}

export type PowerSystemEvent =
  | PowerLowEvent
  | PowerCriticalEvent
  | BatteryAddedEvent
  | BatteryRemovedEvent;
