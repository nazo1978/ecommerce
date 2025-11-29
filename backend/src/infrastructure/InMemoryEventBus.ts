import { EventBus, DomainEvent } from '../core/EventBus';
import { logger } from '../config/logger';

type EventHandler = (event: DomainEvent) => Promise<void>;

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error(`Event handler error for ${event.type}`, error);
      }
    }
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe(eventType: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventType) || [];
    existing.push(handler);
    this.handlers.set(eventType, existing);
  }
}
