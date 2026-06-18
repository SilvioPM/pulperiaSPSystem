import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

function ensurePrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient()
  }
  return globalForPrisma.prisma
}

export const prisma = new Proxy({}, {
  get(_, prop) {
    const client = ensurePrisma()
    const val = client[prop]
    return typeof val === 'function' ? val.bind(client) : val
  },
})
