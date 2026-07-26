import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Next.js dev mode hot-reloads modules; without this guard every reload would
// open a fresh PrismaClient (and a fresh DB connection pool) on top of the last.
export const prisma = global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}
