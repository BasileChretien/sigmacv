import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";

// A PrismaClient scoped to the E2E harness (setup/seed/assertions), separate
// from the app's src/lib/db.ts singleton. Reads DATABASE_URL from .env.e2e.
// Prisma 7 requires a driver adapter (Rust-free client).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
export const db = new PrismaClient({ adapter });
