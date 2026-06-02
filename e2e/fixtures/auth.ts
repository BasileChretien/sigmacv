import { test as base } from "@playwright/test";
import works from "../../tests/fixtures/openalex-works.json";
import type { OpenAlexWork } from "../../src/lib/openalex/types";
import { seedCv, seedSession, seedUser, TEST_ORCID } from "./seed";

interface Fixtures {
  /** A signed-in user (DB session cookie injected) with a seeded CV. */
  authedUserId: string;
}

/**
 * Seed a user + database session + CV, then inject the Auth.js session cookie.
 * This skips the ORCID OAuth roundtrip while still exercising the real
 * `auth()` / PrismaAdapter database-session validation path. The unprefixed
 * cookie name is correct over plain HTTP on localhost.
 */
export const test = base.extend<Fixtures>({
  authedUserId: async ({ context }, use) => {
    const user = await seedUser({
      orcid: TEST_ORCID,
      name: "Basile Chrétien",
      researchConsent: false,
    });
    await seedCv(user.id, works as unknown as OpenAlexWork[]);
    const token = await seedSession(user.id);
    await context.addCookies([
      {
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        expires: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
      },
    ]);
    await use(user.id);
  },
});

export { expect } from "@playwright/test";
