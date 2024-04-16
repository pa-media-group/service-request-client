import { Logger, LoggerOptions, pino } from 'pino';

class LoggerFactory {
  static create(name: string, options?: LoggerOptions): Logger {
    return pino({
      name,
      ...options,
    });
  }
}

export { Logger, LoggerFactory };
