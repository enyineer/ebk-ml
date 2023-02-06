import pino, { BaseLogger } from 'pino';

export class Logger {
  private static instance: BaseLogger | null = null;

  static get logger() {
    let _instance = this.instance;
    if (_instance === null) {
      _instance = pino({
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          }
        },
        level: 'debug',
      });

      this.instance = _instance;
    }
    return _instance;
  }
}