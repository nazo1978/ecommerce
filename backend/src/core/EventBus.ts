export interface DomainEvent {
  type: string;
  payload: unknown;
  timestamp?: Date;
}

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
}
