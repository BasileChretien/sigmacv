import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "@/lib/env";

// Reuse a single PrismaClient across hot-reloads in development to avoid
// exhausting database connections (each client owns a pg connection pool).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7 ships a Rust-free client that connects through a driver adapter.
// The pg adapter manages the PostgreSQL connection pool from DATABASE_URL.
function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
