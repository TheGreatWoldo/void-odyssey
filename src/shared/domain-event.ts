/** Base interface for all domain events. */
export interface DomainEvent {
  readonly type: string;

  /** Unix timestamp (ms) at the moment the event was raised. */
  readonly occurredOn: number;
}

// ---------------------------------------------------------------------------
// Collector — lightweight in-memory queue drained by the application layer.
// ---------------------------------------------------------------------------

export interface DomainEventCollector<E extends DomainEvent> {
  push(event: E): void;

  /** Returns all queued events and clears the queue. */
  drain(): readonly E[];
}

export function createDomainEventCollector<E extends DomainEvent>(): DomainEventCollector<E> {
  const events: E[] = [];

  return {
    push(event: E): void {
      events.push(event);
    },

    drain(): readonly E[] {
      const snapshot = events.slice();
      events.length = 0;
      return snapshot;
    },
  };
}
