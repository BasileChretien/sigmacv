import { randomUUID } from "node:crypto";
import { buildCanonicalCv } from "../../src/lib/canonical/build";
import type { OpenAlexWork } from "../../src/lib/openalex/types";
import { db } from "./db";

export const TEST_ORCID = "0000-0002-7483-2489";

export async function seedUser(
  opts: { orcid?: string | null; name?: string; researchConsent?: boolean } = {},
) {
  return db.user.create({
    data: {
      name: opts.name ?? "Test User",
      orcid: opts.orcid ?? null,
      researchConsent: opts.researchConsent ?? false,
    },
  });
}

export async function seedSession(userId: string): Promise<string> {
  const token = randomUUID();
  await db.session.create({
    data: {
      sessionToken: token,
      userId,
      expires: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });
  return token;
}

/** Seed a schema-valid CV using the real build pipeline + the unit fixtures. */
export async function seedCv(userId: string, works: OpenAlexWork[], name = "Basile Chrétien") {
  const cv = buildCanonicalCv({
    id: randomUUID(),
    resolved: {
      orcid: TEST_ORCID,
      authorIds: ["A5001069481", "A5136414971"],
      displayName: name,
    },
    works,
    now: new Date().toISOString(),
  });
  await db.cv.upsert({
    where: { userId },
    create: {
      id: cv.id,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      document: cv as any,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { document: cv as any, lastSyncedAt: new Date() },
  });
  return cv;
}
