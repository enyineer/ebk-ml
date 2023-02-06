import { PrismaClient } from '@prisma/client';

export class Database {
  private static prisma: PrismaClient | null = null;

  static get client() {
    let _client = this.prisma;
    if (_client === null) {
      _client = new PrismaClient();
      _client.$connect();
      this.prisma = _client;
    }
    return _client;
  }
}