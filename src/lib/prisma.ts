// src/lib/prisma.ts

import { PrismaClient } from '@prisma/client';
import { constructDatabaseUrl } from './db-url';

// Set DATABASE_URL in process.env if it's not already set
if (!process.env.DATABASE_URL) {
  try {
    process.env.DATABASE_URL = constructDatabaseUrl();
  } catch (error) {
    console.error('Failed to construct database URL:', error);
    // Don't crash the app, but log the error
    process.env.DATABASE_URL = 'file:./fallback.db';
    console.warn('Using fallback database connection');
  }
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;