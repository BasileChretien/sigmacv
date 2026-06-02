import { db } from "./fixtures/db";
import { stopOpenAlexServer } from "./fixtures/openalex-server";

export default async function globalTeardown() {
  await stopOpenAlexServer();
  await db.$disconnect();
}
