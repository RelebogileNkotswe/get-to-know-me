import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

function createClient(): PrismaClient {
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    return new PrismaClient({ adapter });
}

// One client per process: reuse it across hot reloads in development so connections are not exhausted.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Shared Prisma client. Server-only; never import this from a Client Component. */
export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = db;
}
