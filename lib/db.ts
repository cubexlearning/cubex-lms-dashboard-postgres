import { PrismaClient } from '@prisma/client'

// Database URL configuration with fallback
const databaseUrl = process.env.DATABASE_URL || "postgres://03d0a8e9e3f26a830766497a2d4270374318c12dcff748155103538275568f6f:sk_6q4NxYcCdnioGU9kX7hl@db.prisma.io:5432/postgres?sslmode=require"

// Create a fresh Prisma client instance every time (no caching)
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
})

// Simple connection function
export async function ensurePrismaConnected(): Promise<void> {
  try {
    await prisma.$connect()
  } catch (err) {
    console.error('Database connection failed:', err)
    throw err
  }
}