import { execSync } from "node:child_process";
import dotenv from "dotenv";
import { db } from "./fixtures/db";
import { startOpenAlexServer } from "./fixtures/openalex-server";

export default async function globalSetup() {
  dotenv.config({ path: ".env.e2e" });

  // Guardrail: never touch a non-test database.
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("_e2e")) {
    throw new Error(
      "Refusing to run E2E: DATABASE_URL must target a database whose name contains '_e2e'.",
    );
  }

  // Create the schema (this project uses `prisma db push`, not migrations).
  // Prisma 7 removed the `--skip-generate` flag; the URL comes from prisma.config.ts.
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: process.env,
  });

  // Clean slate (respect FK order).
  await db.researchEvent.deleteMany();
  await db.cv.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.verificationToken.deleteMany();
  await db.user.deleteMany();

  await startOpenAlexServer();
}
