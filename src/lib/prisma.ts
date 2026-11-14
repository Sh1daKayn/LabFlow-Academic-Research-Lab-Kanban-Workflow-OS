import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  __labflowPrisma?: PrismaClient;
};

export function isPostgresConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getPrismaClient(): PrismaClient | null {
  if (!isPostgresConfigured()) {
    return null;
  }
  if (!globalForPrisma.__labflowPrisma) {
    globalForPrisma.__labflowPrisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.__labflowPrisma;
}
