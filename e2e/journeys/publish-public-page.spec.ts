import { db } from "../fixtures/db";
import { expect, test } from "../fixtures/auth";

test("publish → public page reachable → unpublish → 404", async ({
  page,
  context,
  authedUserId,
}) => {
  await page.goto("/cv");

  // Enable the public page (publish is async; the open-page link appears once
  // /api/cv/publish resolves — match it by href so it's locale-independent).
  await page.getByTestId("publish-toggle").click();
  await expect(page.locator('a[href^="/p/"]')).toBeVisible();

  const row = await db.cv.findUnique({ where: { userId: authedUserId } });
  expect(row?.published).toBe(true);
  const slug = row?.publicSlug;
  expect(slug).toBeTruthy();

  // The public page is reachable WITHOUT auth.
  const anon = await context.browser()!.newContext();
  const anonPage = await anon.newPage();
  const res = await anonPage.goto(`/p/${slug}`);
  expect(res?.status()).toBe(200);
  await expect(anonPage.locator("body")).toContainText("Chrétien");
  await anon.close();

  // Unpublish → 404.
  await page.getByTestId("publish-toggle").click();
  await expect(page.locator('a[href^="/p/"]')).toBeHidden();
  const anon2 = await context.browser()!.newContext();
  const anonPage2 = await anon2.newPage();
  const res2 = await anonPage2.goto(`/p/${slug}`);
  expect(res2?.status()).toBe(404);
  await anon2.close();
});
