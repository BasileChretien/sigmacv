import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

/**
 * The per-CV Open Graph card (`/p/<slug>/og`) renders for a PUBLISHED CV (200 +
 * an image/* content type) and 404s for an unknown slug (fail closed — never
 * renders an unpublished/unknown CV's name).
 */

test("OG image: 200 image for a published slug, 404 for an unknown slug", async ({
  page,
  context,
  authedUserId,
}) => {
  // Publish the CV (async — wait for the open-page link).
  await page.goto("/cv");
  await page.getByTestId("publish-toggle").click();
  await expect(page.locator('a[href^="/p/"]')).toBeVisible();

  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(row?.published).toBe(true);
  const slug = row?.publicSlug;
  expect(slug).toBeTruthy();

  // Fetch the OG card from a FRESH UNAUTHENTICATED context.
  const anon = await context.browser()!.newContext();
  const og = await anon.request.get(`/p/${slug}/og`);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"] ?? "").toMatch(/^image\//);

  // An unknown slug must 404.
  const missing = await anon.request.get("/p/does-not-exist-slug/og");
  expect(missing.status()).toBe(404);

  await anon.close();
});
