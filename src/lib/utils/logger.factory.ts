import * as pino from 'pino';

export class LoggerFactory {
  static create(name: string, options?: pino.LoggerOptions): pino.Logger {
    return pino({
      name,
      ...options,
    });
  }
}
