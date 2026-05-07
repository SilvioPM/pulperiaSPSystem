import { PrismaClient } from '@prisma/client'

// Esto evita crear múltiples conexiones cuando Next.js recarga el código
const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}