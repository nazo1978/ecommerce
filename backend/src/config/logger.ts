import { Logger } from '../core/Logger';

class ConsoleLogger implements Logger {
  private formatMessage(level: string, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  info(message: string, meta?: unknown): void {
    console.log(this.formatMessage('INFO', message, meta));
  }

  warn(message: string, meta?: unknown): void {
    console.warn(this.formatMessage('WARN', message, meta));
  }

  error(message: string, meta?: unknown): void {
    console.error(this.formatMessage('ERROR', message, meta));
  }

  debug(message: string, meta?: unknown): void {
    console.debug(this.formatMessage('DEBUG', message, meta));
  }
}

export const logger = new ConsoleLogger();
