import { expect, test } from "@playwright/test";

test("unauthenticated /cv redirects to the landing page", async ({ page }) => {
  await page.goto("/cv");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: /Sign in with ORCID/i })).toBeVisible();
});

test("an unknown public slug returns 404", async ({ request }) => {
  const res = await request.get("/p/does-not-exist-slug");
  expect(res.status()).toBe(404);
});
