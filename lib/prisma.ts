import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('❌ DATABASE_URL is not set. Please provide it in environment variables.');
    } else {
        console.warn('⚠️ DATABASE_URL is not set. Database features will fail.');
    }
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
