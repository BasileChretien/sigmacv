import type { Prisma } from "../../src/generated/prisma/client";
import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

/**
 * The published public page (`/p/<slug>`) is the FAIR machine-readable surface.
 * Format is chosen by an Accept header OR a stable suffix on the slug. Every
 * format passes through the SAME public projection, so a non-opted-in contact
 * field (email; `display.publicContact.email` defaults false) must never appear.
 */

// A recognizable email we inject into the persisted document. Because
// publicContact.email defaults to false, it must be stripped from every public
// serialization — grepping for it in the public JSON proves the gate holds.
const PRIVATE_EMAIL = "do-not-leak-e2e@example.org";

test("public content negotiation: Accept + suffix formats, contact field stays private", async ({
  page,
  context,
  authedUserId,
}) => {
  // Inject a contact email into the seeded canonical document (opt-in flag stays
  // false), so the "non-opted-in field is absent" assertion is meaningful.
  const seeded = await db.cv.findUnique({ where: { userId: authedUserId } });
  const doc = seeded?.document as Record<string, unknown>;
  const owner = { ...(doc.owner as Record<string, unknown>) };
  owner.contact = { ...(owner.contact as Record<string, unknown>), email: PRIVATE_EMAIL };
  await db.cv.update({
    where: { userId: authedUserId },
    data: { document: { ...doc, owner } as Prisma.InputJsonValue },
  });

  // Publish the CV (publish is async — click the toggle then wait for the
  // open-page link, matched by href so it's locale-independent).
  await page.goto("/cv");
  await page.getByTestId("publish-toggle").click();
  await expect(page.locator('a[href^="/p/"]')).toBeVisible();

  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(row?.published).toBe(true);
  const slug = row?.publicSlug;
  expect(slug).toBeTruthy();

  // A FRESH UNAUTHENTICATED context for the public reads (no session cookie).
  const anon = await context.browser()!.newContext();
  const req = anon.request;

  // 1. Accept: application/ld+json → JSON-LD ProfilePage/Person.
  const jsonld = await req.get(`/p/${slug}`, {
    headers: { Accept: "application/ld+json" },
  });
  expect(jsonld.status()).toBe(200);
  expect(jsonld.headers()["content-type"]).toContain("application/ld+json");
  const ld = JSON.parse(await jsonld.text()) as Record<string, unknown>;
  const ldText = JSON.stringify(ld);
  expect(ldText).toMatch(/"@type"\s*:\s*"(ProfilePage|Person)"/);

  // 2. Accept: application/x-bibtex → BibTeX (contains an "@<type>{" entry).
  const bib = await req.get(`/p/${slug}`, {
    headers: { Accept: "application/x-bibtex" },
  });
  expect(bib.status()).toBe(200);
  expect(bib.headers()["content-type"]).toContain("application/x-bibtex");
  expect(await bib.text()).toContain("@");

  // 3. Suffix paths force the format regardless of Accept.
  const jsonRes = await req.get(`/p/${slug}.json`);
  expect(jsonRes.status()).toBe(200);
  expect(jsonRes.headers()["content-type"]).toContain("application/json");
  const jsonBody = await jsonRes.text();
  const canonical = JSON.parse(jsonBody) as Record<string, unknown>;
  expect(canonical).toHaveProperty("owner");

  const bibRes = await req.get(`/p/${slug}.bib`);
  expect(bibRes.status()).toBe(200);
  expect(bibRes.headers()["content-type"]).toContain("application/x-bibtex");
  expect(await bibRes.text()).toContain("@");

  const cslRes = await req.get(`/p/${slug}.csl.json`);
  expect(cslRes.status()).toBe(200);
  expect(cslRes.headers()["content-type"]).toContain("application/vnd.citationstyles.csl+json");
  const cslParsed = JSON.parse(await cslRes.text()) as unknown;
  expect(Array.isArray(cslParsed)).toBe(true);

  // 4. The non-opted-in contact email must NOT leak into the public JSON body.
  expect(jsonBody).not.toContain(PRIVATE_EMAIL);

  await anon.close();
});
