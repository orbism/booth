// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { constructDatabaseUrl } from './db-url';

// Set DATABASE_URL in process.env if it's not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = constructDatabaseUrl();
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;